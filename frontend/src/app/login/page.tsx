import { loginUrl } from '@/lib/api';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">ReachInbox</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to schedule and track your emails</p>
        <a
          href={loginUrl}
          className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Sign in with Google
        </a>
      </div>
    </main>
  );
}