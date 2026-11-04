'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { parseLeads } from '@/lib/parseLeads';

interface Props {
  onClose: () => void;
  onScheduled: (count: number) => void;
  onError: (msg: string) => void;
}

const input = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none';

export default function ComposeModal({ onClose, onScheduled, onError }: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [leads, setLeads] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delaySec, setDelaySec] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);
  const [saving, setSaving] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setLeads(parseLeads(await file.text()));
  };

  const canSubmit = subject.trim() && body.trim() && leads.length > 0 && !saving;

  const submit = async () => {
    setSaving(true);
    try {
      await api('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          body: body.replace(/\n/g, '<br/>'),
          leads,
          startTime: startTime ? new Date(startTime).toISOString() : undefined,
          delayMs: Math.max(0, delaySec) * 1000,
          hourlyLimit,
        }),
      });
      onScheduled(leads.length);
      onClose();
    } catch (e: any) {
      onError(e.message ?? 'Failed to schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Compose New Email" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Body</label>
          <textarea className={input} rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Leads (CSV or text file)</label>
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5"
          />
          {fileName && (
            <p className="mt-1 text-xs text-gray-600">
              {fileName}: <b>{leads.length}</b> email address{leads.length === 1 ? '' : 'es'} detected
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Start time</label>
            <input type="datetime-local" className={input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Delay (sec)</label>
            <input type="number" min={0} className={input} value={delaySec} onChange={(e) => setDelaySec(+e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Hourly limit</label>
            <input type="number" min={1} className={input} value={hourlyLimit} onChange={(e) => setHourlyLimit(+e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-gray-500">Leave start time empty to start now.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {saving ? 'Scheduling…' : 'Schedule'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}