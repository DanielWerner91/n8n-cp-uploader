"use client";

import { Loader2 } from "lucide-react";

export function ProcessingStep() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)]" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Analyzing Your Tracker</h2>
      <p className="text-[var(--muted-foreground)]">
        AI is reading your spreadsheet and extracting initiatives, savings data,
        baselines, and profiles. This may take 30-60 seconds.
      </p>
    </div>
  );
}
