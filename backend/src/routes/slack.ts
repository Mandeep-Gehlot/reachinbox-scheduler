import { Router } from 'express';
import crypto from 'crypto';
import { pool } from '../db';
import { requireAuth } from '../auth';

export const slackRouter = Router();
const redirectUri = () => `${process.env.BACKEND_URL}/slack/callback`;
const back = (q: string) => `${process.env.FRONTEND_URL}/dashboard?slack=${q}`;

slackRouter.get('/connect', requireAuth, (req: any, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.slackState = state;
  const url = new URL('https://slack.com/oauth/v2/authorize');
  url.searchParams.set('client_id', process.env.SLACK_CLIENT_ID!);
  url.searchParams.set('scope', 'incoming-webhook');
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

slackRouter.get('/callback', requireAuth, async (req: any, res) => {
  const { code, state } = req.query;
  if (!code || state !== req.session.slackState) return res.redirect(back('error'));
  try {
    const r = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: String(code),
        redirect_uri: redirectUri(),
      }),
    });
    const j: any = await r.json();
    if (!j.ok || !j.incoming_webhook?.url) return res.redirect(back('error'));
    await pool.query('UPDATE users SET slack_webhook=$1 WHERE id=$2', [j.incoming_webhook.url, req.user.id]);
    req.session.slackState = null;
    res.redirect(back('connected'));
  } catch {
    res.redirect(back('error'));
  }
});

slackRouter.get('/status', requireAuth, async (req: any, res) => {
  const { rows } = await pool.query('SELECT slack_webhook FROM users WHERE id=$1', [req.user.id]);
  res.json({ connected: !!rows[0]?.slack_webhook });
});

slackRouter.post('/disconnect', requireAuth, async (req: any, res) => {
  await pool.query('UPDATE users SET slack_webhook=NULL WHERE id=$1', [req.user.id]);
  res.json({ connected: false });
});