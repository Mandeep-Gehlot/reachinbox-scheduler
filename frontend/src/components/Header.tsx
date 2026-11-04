'use client';
import { api } from '@/lib/api';
import type { User } from '@/types';

export default function Header({ user }: { user: User }) {
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  };

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <h1 className="text-lg font-semibold">ReachInbox</h1>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatar} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
        <div className="text-right leading-tight">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="ml-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}