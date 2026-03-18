"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

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
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-semibold">
          Upload Your Savings Tracker
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Upload any Excel savings tracker and we will convert it to the
          Connected Platform bulk upload format.
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all ${
          isDragging
            ? "border-[var(--primary)] bg-[var(--accent)]"
            : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--accent)]"
        }`}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900">
              <FileSpreadsheet className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedFile(null)}
                className="rounded-lg px-4 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Change File
              </button>
              <button
                onClick={() => onUpload(selectedFile)}
                className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                Extract Data
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--muted)]">
              <Upload className="h-7 w-7 text-[var(--muted-foreground)]" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                Drop your Excel file here or click to browse
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
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

      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-5">
        <h3 className="mb-3 text-sm font-semibold">How it works</h3>
        <ol className="space-y-2 text-sm text-[var(--muted-foreground)]">
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
              1
            </span>
            Upload your savings tracker (any format)
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
              2
            </span>
            AI extracts initiatives, savings, baselines, and profiles
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
              3
            </span>
            Review and add CP Initiative IDs if needed
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
              4
            </span>
            Download the formatted CP bulk upload file
          </li>
        </ol>
      </div>
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
