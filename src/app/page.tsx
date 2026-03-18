"use client";

import { useState } from "react";
import type { AppStep, ExtractionResult } from "@/lib/types";
import { UploadStep } from "@/components/upload-step";
import { ProcessingStep } from "@/components/processing-step";
import { ReviewStep } from "@/components/review-step";
import { GeneratingStep } from "@/components/generating-step";
import { DownloadStep } from "@/components/download-step";

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setStep("processing");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Extraction failed");
      }

      const result: ExtractionResult = await res.json();
      setExtractionResult(result);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    }
  };

  const handleGenerate = async (result: ExtractionResult) => {
    setStep("generating");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStep("download");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep("review");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setExtractionResult(null);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">
              CP
            </div>
            <div>
              <h1 className="text-lg font-semibold">CP Uploader</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Savings Tracker to Connected Platform
              </p>
            </div>
          </div>
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Progress Steps */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {(
            [
              { key: "upload", label: "Upload" },
              { key: "review", label: "Review" },
              { key: "download", label: "Download" },
            ] as const
          ).map((s, i) => {
            const stepOrder = ["upload", "review", "download"];
            const currentOrder = stepOrder.indexOf(
              step === "processing"
                ? "upload"
                : step === "generating"
                  ? "review"
                  : step
            );
            const thisOrder = stepOrder.indexOf(s.key);
            const isActive = thisOrder <= currentOrder;

            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isActive
                      ? "text-[var(--foreground)] font-medium"
                      : "text-[var(--muted-foreground)]"
                  )}
                >
                  {s.label}
                </span>
                {i < 2 && (
                  <div
                    className={cn(
                      "mx-2 h-px w-12",
                      isActive
                        ? "bg-[var(--primary)]"
                        : "bg-[var(--border)]"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {step === "upload" && <UploadStep onUpload={handleFileUpload} />}
        {step === "processing" && <ProcessingStep />}
        {step === "review" && extractionResult && (
          <ReviewStep
            result={extractionResult}
            onGenerate={handleGenerate}
            onBack={() => setStep("upload")}
          />
        )}
        {step === "generating" && <GeneratingStep />}
        {step === "download" && downloadUrl && (
          <DownloadStep
            url={downloadUrl}
            projectName={extractionResult?.projectName || "output"}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
