export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-cyan-400" />
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    </div>
  );
}
