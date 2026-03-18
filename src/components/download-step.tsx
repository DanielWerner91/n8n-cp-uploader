"use client";

import { motion } from "motion/react";
import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface DownloadStepProps {
  url: string;
  projectName: string;
  onReset: () => void;
}

export function DownloadStep({ url, projectName, onReset }: DownloadStepProps) {
  const filename = `${projectName.replace(/[^a-zA-Z0-9-_]/g, "_")}_CP_Upload.xlsx`;

  return (
    <div className="mx-auto max-w-md text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mb-8 flex justify-center"
      >
        <div className="relative">
          {/* Success burst */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-green-500/30"
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-1 ring-green-500/30">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Your File is Ready
        </h2>
        <p className="mb-8 text-[var(--muted-foreground)] leading-relaxed">
          The CP bulk upload file has been generated with all 6 sheets formatted
          correctly. Download it and upload to Connected Platform.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-3 items-center"
      >
        <a href={url} download={filename}>
          <ShimmerButton
            shimmerColor="#4ade80"
            background="rgba(34, 197, 94, 0.85)"
            borderRadius="12px"
            className="text-sm font-semibold !text-white px-8"
          >
            <Download className="mr-2 h-5 w-5" />
            Download {filename}
          </ShimmerButton>
        </a>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm transition-all hover:bg-[var(--muted)] hover:border-[var(--primary)]/30"
        >
          <RotateCcw className="h-4 w-4" />
          Convert Another File
        </button>
      </motion.div>
    </div>
  );
}
