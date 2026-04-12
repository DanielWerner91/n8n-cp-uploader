'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Wrong password');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-xl font-semibold text-white text-center">CP Uploader</h1>
        <p className="mb-6 text-sm text-zinc-500 text-center">Internal tool. Enter password to continue.</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoFocus className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-cyan-500" />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-medium text-zinc-900 hover:bg-cyan-400 disabled:opacity-50">
          {loading ? 'Checking...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
