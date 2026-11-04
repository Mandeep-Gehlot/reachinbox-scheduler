'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function SlackButton() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    api<{ connected: boolean }>('/slack/status')
      .then((r) => setConnected(r.connected))
      .catch(() => setConnected(false));
  }, []);

  if (connected === null) return null;

  if (connected) {
    return (
      <Button
        variant="secondary"
        onClick={async () => {
          await api('/slack/disconnect', { method: 'POST' });
          setConnected(false);
        }}
      >
        Slack connected · Disconnect
      </Button>
    );
  }
  return (
    <a href={`${BASE}/slack/connect`}>
      <Button variant="secondary" type="button">Connect Slack</Button>
    </a>
  );
}