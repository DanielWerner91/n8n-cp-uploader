'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      posthog.captureException?.(error, { app_name: 'cp-uploader' });
    } catch {}
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mb-4 text-4xl">📊</div>
        <h1 className="mb-2 text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mb-6 text-sm text-zinc-400">An unexpected error occurred. It has been reported.</p>
        {error.digest && <p className="mb-4 font-mono text-xs text-zinc-600">error id: {error.digest}</p>}
        <button onClick={reset} className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-cyan-400">Try again</button>
      </div>
    </div>
  );
}
