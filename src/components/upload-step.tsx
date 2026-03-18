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
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface UploadStepProps {
  onUpload: (file: File) => void;
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && isExcelFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isExcelFile(file)) {
        setSelectedFile(file);
      }
    },
    []
  );

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

      {/* Upload zone with glowing effect */}
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
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border bg-[var(--card)]/80 backdrop-blur-sm p-12 transition-all duration-300 ${
            isDragging
              ? "border-[var(--primary)] bg-[var(--accent)]"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
          }`}
        >
          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
                  <FileSpreadsheet className="h-8 w-8 text-green-400" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white font-bold"
                >
                  &#10003;
                </motion.div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{selectedFile.name}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="rounded-xl px-4 py-2.5 text-sm text-[var(--muted-foreground)] transition-all hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                >
                  Change File
                </button>
                <ShimmerButton
                  onClick={() => onUpload(selectedFile)}
                  shimmerColor="#60a5fa"
                  background="rgba(59, 130, 246, 0.9)"
                  borderRadius="12px"
                  className="text-sm font-semibold !text-white"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract Data
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ShimmerButton>
              </div>
            </motion.div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-5">
              <motion.div
                animate={
                  isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }
                }
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/20"
              >
                <Upload className="h-8 w-8 text-[var(--primary)]" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold text-lg">
                  Drop your Excel file here or click to browse
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Supports .xlsx and .xls files
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      </motion.div>

      {/* How it works - cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 grid grid-cols-2 gap-3"
      >
        {[
          {
            icon: Upload,
            label: "Upload tracker",
            desc: "Any Excel format",
          },
          {
            icon: Sparkles,
            label: "AI extracts data",
            desc: "Initiatives, savings, profiles",
          },
          {
            icon: Table2,
            label: "Review & edit",
            desc: "Add CP Initiative IDs",
          },
          {
            icon: Download,
            label: "Download output",
            desc: "6-sheet CP bulk upload",
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.08 }}
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
