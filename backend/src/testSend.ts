import nodemailer from 'nodemailer';
import { getTransport } from './mailer';
import { pool } from './db';

(async () => {
  const { rows } = await pool.query('SELECT * FROM senders LIMIT 1');
  const t = await getTransport(rows[0].id);
  const info = await t.sendMail({
    from: rows[0].email, to: 'test@example.com',
    subject: 'Hello', text: 'It works',
  });
  console.log('Preview:', nodemailer.getTestMessageUrl(info));
  process.exit(0);
})();