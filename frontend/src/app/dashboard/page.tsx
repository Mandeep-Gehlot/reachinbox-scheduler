'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import EmailTable from '@/components/EmailTable';
import ComposeModal from '@/components/ComposeModal';
import SlackButton from '@/components/SlackButton';
import Button from '@/components/ui/Button';
import Toast, { type ToastState } from '@/components/ui/Toast';
import { useUser } from '@/hooks/useUser';
import { useEmails } from '@/hooks/useEmails';

type Tab = 'scheduled' | 'sent';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [tab, setTab] = useState<Tab>('scheduled');
  const [composing, setComposing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const { rows, loading: rowsLoading, error, reload } = useEmails(tab);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="p-10 text-center text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="mx-auto max-w-5xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg bg-gray-200 p-1">
            {(['scheduled', 'sent'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-sm capitalize ${
                  tab === t ? 'bg-white font-medium shadow-sm' : 'text-gray-600'
                }`}
              >
                {t} emails
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <SlackButton />
            <Button onClick={() => setComposing(true)}>Compose New Email</Button>
          </div>
        </div>

        <div className="mt-6">
          <EmailTable rows={rows} loading={rowsLoading} error={error} variant={tab} />
        </div>
      </main>

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onScheduled={(n) => {
            setToast({ type: 'success', message: `${n} email${n === 1 ? '' : 's'} scheduled` });
            setTab('scheduled');
            reload();
          }}
          onError={(m) => setToast({ type: 'error', message: m })}
        />
      )}
      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}