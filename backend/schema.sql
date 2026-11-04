CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, google_id TEXT UNIQUE, email TEXT, name TEXT, avatar TEXT,
  slack_webhook TEXT
);
CREATE TABLE IF NOT EXISTS senders (
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id),
  email TEXT, smtp_user TEXT, smtp_pass TEXT
);
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT REFERENCES users(id),
  sender_id INT REFERENCES senders(id),
  to_email TEXT NOT NULL, subject TEXT, body TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS emails_status_idx ON emails (status, scheduled_at);