import { pool } from './db';

async function createAccount() {
  const r = await fetch('https://api.nodemailer.com/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestor: 'nodemailer', version: '6.9.0' }),
  });
  const j: any = await r.json();
  if (j.status !== 'success') throw new Error('Ethereal signup failed: ' + JSON.stringify(j));
  return { user: j.user as string, pass: j.pass as string };
}

(async () => {
  const { rows } = await pool.query('SELECT id FROM senders ORDER BY id');
  for (const r of rows) {
    const a = await createAccount();
    await pool.query(
      'UPDATE senders SET email=$1, smtp_user=$1, smtp_pass=$2 WHERE id=$3',
      [a.user, a.pass, r.id]
    );
    console.log('sender', r.id, a.user);
  }
  process.exit(0);
})();