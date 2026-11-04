'use client';
import type { ReactNode } from 'react';

export default function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-xl leading-none text-gray-500 hover:text-black">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}