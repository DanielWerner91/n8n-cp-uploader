"use client";

import { CheckCircle2, Download, RotateCcw } from "lucide-react";

interface DownloadStepProps {
  url: string;
  projectName: string;
  onReset: () => void;
}

export function DownloadStep({ url, projectName, onReset }: DownloadStepProps) {
  const filename = `${projectName.replace(/[^a-zA-Z0-9-_]/g, "_")}_CP_Upload.xlsx`;

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <h2 className="mb-2 text-xl font-semibold">Your File is Ready</h2>
      <p className="mb-8 text-[var(--muted-foreground)]">
        The CP bulk upload file has been generated with all 6 sheets formatted
        correctly. Download it and upload to Connected Platform.
      </p>
      <div className="flex flex-col gap-3">
        <a
          href={url}
          download={filename}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:opacity-90"
        >
          <Download className="h-5 w-5" />
          Download {filename}
        </a>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-6 py-3 text-sm transition-colors hover:bg-[var(--muted)]"
        >
          <RotateCcw className="h-4 w-4" />
          Convert Another File
        </button>
      </div>
    </div>
  );
}
