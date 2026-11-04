import type { EmailRow } from '@/types';
import { fmtDate } from '@/lib/format';

const badge: Record<EmailRow['status'], string> = {
  scheduled: 'bg-amber-100 text-amber-800',
  sending: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

interface Props {
  rows: EmailRow[];
  loading: boolean;
  error: string | null;
  variant: 'scheduled' | 'sent';
}

export default function EmailTable({ rows, loading, error, variant }: Props) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;
  }
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
        {variant === 'scheduled' ? 'No scheduled emails yet. Click “Compose New Email” to add some.' : 'No sent emails yet.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">{variant === 'scheduled' ? 'Scheduled time' : 'Sent time'}</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-3">{r.to_email}</td>
              <td className="max-w-xs truncate px-4 py-3">{r.subject}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {fmtDate(variant === 'scheduled' ? r.scheduled_at : r.sent_at ?? r.scheduled_at)}
              </td>
              <td className="px-4 py-3">
                <span title={r.error ?? ''} className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[r.status]}`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}