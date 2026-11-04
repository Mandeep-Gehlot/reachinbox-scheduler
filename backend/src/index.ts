import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import passport from 'passport';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { config } from './config';
import { pool } from './db';
import { emailQueue, enqueue } from './queue';
import { indexEmail, searchEmails } from './services/search';
import { authRouter, requireAuth } from './auth';
import { slackRouter } from './routes/slack';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.use(cookieSession({ name: 'session', secret: process.env.SESSION_SECRET!, maxAge: 7 * 864e5 }));
app.use((req: any, _res, next) => { // passport 0.7 + cookie-session shim
  if (req.session && !req.session.regenerate) req.session.regenerate = (cb: any) => cb();
  if (req.session && !req.session.save) req.session.save = (cb: any) => cb();
  next();
});
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRouter);
app.use('/slack', slackRouter);

const board = new ExpressAdapter();
board.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(emailQueue)], serverAdapter: board });
app.use('/admin/queues', board.getRouter());

app.post('/api/schedule', requireAuth, async (req, res) => {
  const { subject, body, leads, startTime, delayMs = 2000, hourlyLimit } = req.body;
  if (!subject || !body || !Array.isArray(leads) || !leads.length) {
    return res.status(400).json({ error: 'subject, body and leads are required' });
  }
  const userId = (req.user as any).id;
  const { rows: senders } = await pool.query('SELECT id FROM senders ORDER BY id');
  if (!senders.length) return res.status(400).json({ error: 'no senders configured' });

  const limit = hourlyLimit ?? config.maxPerHourPerSender;
  let t = startTime ? new Date(startTime).getTime() : Date.now();

  for (let i = 0; i < leads.length; i++) {
    const sender = senders[i % senders.length];
    const { rows } = await pool.query(
      `INSERT INTO emails (user_id, sender_id, to_email, subject, body, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userId, sender.id, leads[i], subject, body, new Date(t)]
    );
    await enqueue(rows[0].id, new Date(t), limit);
    await indexEmail(rows[0].id);
    t += delayMs;
  }
  res.json({ scheduled: leads.length });
});

app.get('/api/emails', requireAuth, async (req, res) => {
  const userId = (req.user as any).id;
  const sent = req.query.status === 'sent';
  const { rows } = await pool.query(
    sent
      ? `SELECT * FROM emails WHERE user_id=$1 AND status IN ('sent','failed') ORDER BY sent_at DESC NULLS LAST LIMIT 500`
      : `SELECT * FROM emails WHERE user_id=$1 AND status IN ('scheduled','sending') ORDER BY scheduled_at LIMIT 500`,
    [userId]
  );
  res.json(rows);
});

app.get('/api/search', requireAuth, async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.json([]);
  try {
    res.json(await searchEmails(q, (req.user as any).id));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(config.port, () => console.log(`API on :${config.port}`));