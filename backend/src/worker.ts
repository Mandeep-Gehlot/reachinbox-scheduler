import { Worker, DelayedError } from 'bullmq';
import { config } from './config';
import { pool } from './db';
import { emailQueue, enqueue } from './queue';
import { tryConsume } from './rateLimiter';
import { getTransport } from './mailer';
import { notifySlackRateLimit } from './services/slack';
import { indexEmail } from './services/search';

const worker = new Worker(
  'emails',
  async (job, token) => {
    const { emailId, hourlyLimit } = job.data;

    // idempotency: atomically claim the row
    const { rows } = await pool.query(
      `UPDATE emails e SET status='sending' WHERE e.id=$1 AND e.status='scheduled'
       RETURNING e.*, (SELECT email FROM senders WHERE id=e.sender_id) AS sender_email`,
      [emailId]
    );
    if (!rows.length) return;
    const email = rows[0];

    const rl = await tryConsume(email.sender_id, hourlyLimit ?? config.maxPerHourPerSender);
    if (!rl.ok) {
      await pool.query(`UPDATE emails SET status='scheduled' WHERE id=$1`, [emailId]);
      await notifySlackRateLimit(email.user_id, email.sender_id);
      await job.moveToDelayed(rl.nextWindow + Math.random() * 5000, token);
      throw new DelayedError();
    }

    try {
      const transport = await getTransport(email.sender_id);
      await transport.sendMail({
        from: email.sender_email,
        to: email.to_email,
        subject: email.subject,
        html: email.body,
      });
      await pool.query(`UPDATE emails SET status='sent', sent_at=now() WHERE id=$1`, [emailId]);
      await indexEmail(emailId);
    } catch (e: any) {
      const finalTry = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await pool.query(
        `UPDATE emails SET status=$2, error=$3 WHERE id=$1`,
        [emailId, finalTry ? 'failed' : 'scheduled', e.message]
      );
      throw e;
    }
  },
  {
    connection: config.redis,
    concurrency: config.concurrency,
    limiter: { max: 1, duration: config.minDelayMs },
  }
);

worker.on('failed', (job, err) => {
  if (err.name !== 'DelayedError') console.error('job failed', job?.id, err.message);
});

// restart recovery: re-enqueue any DB row that has no job in Redis
async function reconcile() {
  await pool.query(`UPDATE emails SET status='scheduled' WHERE status='sending'`);
  const { rows } = await pool.query(`SELECT id, scheduled_at FROM emails WHERE status='scheduled'`);
  let n = 0;
  for (const r of rows) {
    if (!(await emailQueue.getJob(r.id))) {
      await enqueue(r.id, r.scheduled_at, config.maxPerHourPerSender);
      n++;
    }
  }
  console.log(`reconciled ${n} missing jobs`);
}

reconcile().then(() => console.log('worker running'));