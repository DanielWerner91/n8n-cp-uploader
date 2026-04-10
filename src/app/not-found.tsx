import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mb-4 text-5xl">📂</div>
        <h1 className="mb-2 text-2xl font-semibold text-white">Page not found</h1>
        <p className="mb-6 text-sm text-zinc-400">This page doesn&apos;t exist.</p>
        <Link href="/" className="inline-block rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-cyan-400">Back to uploader</Link>
      </div>
    </div>
  );
}
