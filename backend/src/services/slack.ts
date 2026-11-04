import IORedis from 'ioredis';
import { config } from '../config';
import { pool } from '../db';

const redis = new IORedis(config.redis);

export async function notifySlackRateLimit(userId: number, senderId: number) {
  try {
    const { rows } = await pool.query('SELECT slack_webhook FROM users WHERE id=$1', [userId]);
    const hook = rows[0]?.slack_webhook;
    if (!hook) return; // not connected: silently skip

    // one message per sender per hour window
    const hour = Math.floor(Date.now() / 3.6e6);
    const first = await redis.set(`slack:rl:${senderId}:${hour}`, '1', 'EX', 3700, 'NX');
    if (!first) return;

    const { rows: s } = await pool.query('SELECT email FROM senders WHERE id=$1', [senderId]);
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `:warning: Hourly send limit reached for sender ${s[0]?.email ?? senderId}. Remaining emails are rescheduled to the next hour.`,
      }),
    });
  } catch (e: any) {
    console.error('slack notify failed', e.message); // never break sending
  }
}