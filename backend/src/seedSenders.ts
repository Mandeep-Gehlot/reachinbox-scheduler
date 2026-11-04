import nodemailer from 'nodemailer';
import { pool } from './db';

(async () => {
  for (let i = 0; i < 3; i++) {
    const a = await nodemailer.createTestAccount();
    await pool.query(
      'INSERT INTO senders (email, smtp_user, smtp_pass) VALUES ($1,$2,$3)',
      [a.user, a.user, a.pass]
    );
    console.log('sender', a.user);
  }
  process.exit(0);
})();