export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

export interface EmailRow {
  id: string;
  to_email: string;
  subject: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'scheduled' | 'sending' | 'sent' | 'failed';
  error: string | null;
}