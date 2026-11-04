'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { EmailRow } from '@/types';

export function useEmails(status: 'scheduled' | 'sent') {
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setRows(await api<EmailRow[]>(`/api/emails?status=${status}`));
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 5000); // live refresh
    return () => clearInterval(id);
  }, [load]);

  return { rows, loading, error, reload: load };
}