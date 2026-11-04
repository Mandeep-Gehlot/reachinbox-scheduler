import nodemailer from 'nodemailer';
import { pool } from './db';

export async function getTransport(senderId: number) {
  const { rows } = await pool.query('SELECT * FROM senders WHERE id=$1', [senderId]);
  const s = rows[0];
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email', port: 587,
    auth: { user: s.smtp_user, pass: s.smtp_pass },
  });
}