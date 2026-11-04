'use client';
import { useEffect } from 'react';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ toast, onDone }: { toast: ToastState | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {toast.message}
    </div>
  );
}