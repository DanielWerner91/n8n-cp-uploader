"use client";

import { Loader2 } from "lucide-react";

export function GeneratingStep() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)]" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Generating CP Upload File</h2>
      <p className="text-[var(--muted-foreground)]">
        Building the bulk upload Excel with all 6 sheets in the correct format.
      </p>
    </div>
  );
}
