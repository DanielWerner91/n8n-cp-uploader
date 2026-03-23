"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Table2,
  Download,
  GitMerge,
  X,
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface UploadStepProps {
  onUpload: (trackerFile: File, cpExportFile?: File) => void;
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const [isDraggingTracker, setIsDraggingTracker] = useState(false);
  const [isDraggingCp, setIsDraggingCp] = useState(false);
  const [trackerFile, setTrackerFile] = useState<File | null>(null);
  const [cpExportFile, setCpExportFile] = useState<File | null>(null);

  const isMergeMode = !!cpExportFile;

  const handleTrackerDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDraggingTracker(true);
    } else {
      setIsDraggingTracker(false);
    }
  }, []);

  const handleTrackerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTracker(false);
    const file = e.dataTransfer.files[0];
    if (file && isExcelFile(file)) setTrackerFile(file);
  }, []);

  const handleCpDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDraggingCp(true);
    } else {
      setIsDraggingCp(false);
    }
  }, []);

  const handleCpDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCp(false);
    const file = e.dataTransfer.files[0];
    if (file && isExcelFile(file)) setCpExportFile(file);
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8 text-center"
      >
        <h2 className="mb-3 text-3xl font-bold tracking-tight">
          Upload Your <span className="gradient-text">Savings Tracker</span>
        </h2>
        <p className="text-[var(--muted-foreground)] text-base">
          Upload any Excel savings tracker and we will convert it to the
          Connected Platform bulk upload format.
        </p>
      </motion.div>

      {/* Tracker upload zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative rounded-2xl"
      >
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={200}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div
          onDragEnter={handleTrackerDrag}
          onDragLeave={handleTrackerDrag}
          onDragOver={handleTrackerDrag}
          onDrop={handleTrackerDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border bg-[var(--card)]/80 backdrop-blur-sm p-10 transition-all duration-300 ${
            isDraggingTracker
              ? "border-[var(--primary)] bg-[var(--accent)]"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
          }`}
        >
          {trackerFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
                  <FileSpreadsheet className="h-6 w-6 text-green-400" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[8px] text-white font-bold"
                >
                  &#10003;
                </motion.div>
              </div>
              <div>
                <p className="font-semibold">{trackerFile.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {(trackerFile.size / 1024).toFixed(1)} KB — Savings Tracker
                </p>
              </div>
              <button
                onClick={() => setTrackerFile(null)}
                className="ml-2 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-4">
              <motion.div
                animate={
                  isDraggingTracker ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }
                }
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/20"
              >
                <Upload className="h-7 w-7 text-[var(--primary)]" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold">
                  Drop your savings tracker here or click to browse
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  .xlsx or .xls — any tracker format
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && isExcelFile(file)) setTrackerFile(file);
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      </motion.div>

      {/* CP Export upload zone (optional) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-4 relative rounded-2xl"
      >
        <div
          onDragEnter={handleCpDrag}
          onDragLeave={handleCpDrag}
          onDragOver={handleCpDrag}
          onDrop={handleCpDrop}
          className={`relative flex items-center justify-center rounded-2xl border border-dashed bg-[var(--card)]/40 backdrop-blur-sm p-6 transition-all duration-300 ${
            isDraggingCp
              ? "border-amber-400 bg-amber-500/5"
              : cpExportFile
              ? "border-amber-400/50 bg-amber-500/5"
              : "border-[var(--border)] hover:border-amber-400/30"
          }`}
        >
          {cpExportFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                  <GitMerge className="h-5 w-5 text-amber-400" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white font-bold"
                >
                  &#10003;
                </motion.div>
              </div>
              <div>
                <p className="font-semibold text-sm">{cpExportFile.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {(cpExportFile.size / 1024).toFixed(1)} KB — CP Export (merge mode)
                </p>
              </div>
              <button
                onClick={() => setCpExportFile(null)}
                className="ml-2 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <label className="flex cursor-pointer items-center gap-4 w-full justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <GitMerge className="h-5 w-5 text-amber-400/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  Have existing CP data?{" "}
                  <span className="text-amber-400 underline underline-offset-2">
                    Upload it here
                  </span>{" "}
                  to merge
                </p>
                <p className="text-xs text-[var(--muted-foreground)]/60 mt-0.5">
                  Optional — download the current CP bulk uploader file and drop it here
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && isExcelFile(file)) setCpExportFile(file);
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      </motion.div>

      {/* Action button */}
      {trackerFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex justify-center"
        >
          <ShimmerButton
            onClick={() => onUpload(trackerFile, cpExportFile || undefined)}
            shimmerColor={isMergeMode ? "#fbbf24" : "#60a5fa"}
            background={isMergeMode ? "rgba(217, 119, 6, 0.9)" : "rgba(59, 130, 246, 0.9)"}
            borderRadius="12px"
            className="text-sm font-semibold !text-white"
          >
            {isMergeMode ? (
              <>
                <GitMerge className="mr-2 h-4 w-4" />
                Merge & Update
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Extract Data
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </ShimmerButton>
        </motion.div>
      )}

      {/* How it works - cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-10 grid grid-cols-2 gap-3"
      >
        {(isMergeMode
          ? [
              { icon: Upload, label: "Upload both files", desc: "Tracker + CP export" },
              { icon: Sparkles, label: "AI merges data", desc: "Fuzzy matches & updates" },
              { icon: Table2, label: "Review changes", desc: "See what was added or changed" },
              { icon: Download, label: "Download output", desc: "Updated CP bulk upload" },
            ]
          : [
              { icon: Upload, label: "Upload tracker", desc: "Any Excel format" },
              { icon: Sparkles, label: "AI extracts data", desc: "Initiatives, savings, profiles" },
              { icon: Table2, label: "Review & edit", desc: "Add CP Initiative IDs" },
              { icon: Download, label: "Download output", desc: "6-sheet CP bulk upload" },
            ]
        ).map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-3.5 transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--card)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 transition-colors group-hover:bg-[var(--primary)]/15">
              <item.icon className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function isExcelFile(file: File): boolean {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel" ||
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls")
  );
}
