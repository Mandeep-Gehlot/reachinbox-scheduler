import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReachInbox Scheduler',
  description: 'Schedule and track outbound emails',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
     <body suppressHydrationWarning className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}