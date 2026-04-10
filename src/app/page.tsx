"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import posthog from "posthog-js";
import type { AppStep, ExtractionResult } from "@/lib/types";
import { UploadStep } from "@/components/upload-step";
import { ProcessingStep } from "@/components/processing-step";
import { ReviewStep } from "@/components/review-step";
import { GeneratingStep } from "@/components/generating-step";
import { DownloadStep } from "@/components/download-step";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { FeedbackButton } from "@/components/feedback-button";
import { cn } from "@/lib/utils";

const steps = [
  { key: "upload", label: "Upload", num: 1 },
  { key: "review", label: "Review", num: 2 },
  { key: "download", label: "Download", num: 3 },
] as const;

function getStepIndex(step: AppStep): number {
  if (step === "upload" || step === "processing") return 0;
  if (step === "review" || step === "generating") return 1;
  return 2;
}

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStepIndex = getStepIndex(step);

  const handleFileUpload = async (trackerFile: File, cpExportFile?: File) => {
    posthog.capture("file_uploaded", {
      mode: cpExportFile ? "merge" : "generate",
      file_name: trackerFile.name,
    });
    setStep("processing");
    setError(null);

    const formData = new FormData();
    formData.append("file", trackerFile);
    if (cpExportFile) {
      formData.append("cpExport", cpExportFile);
    }

    const endpoint = cpExportFile ? "/api/merge" : "/api/extract";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `Request failed (${res.status})`;
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          const text = await res.text();
          if (res.status === 504 || text.includes("timeout") || text.includes("FUNCTION_INVOCATION_TIMEOUT")) {
            errorMsg = "The AI took too long to respond. Try uploading a smaller file or fewer sheets.";
          }
        }
        throw new Error(errorMsg);
      }

      let result: ExtractionResult;
      try {
        result = await res.json();
      } catch {
        throw new Error("Server returned an invalid response. The file may be too large for the AI to process.");
      }
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
      posthog.capture("cp_format_generated", {
        initiatives_count: result.initiatives?.length ?? 0,
      });
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
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated background grid */}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.15}
        duration={3}
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
      />

      {/* Top gradient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-blue-500/5 blur-[120px]" />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
              CP
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                CP Uploader
              </h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Savings Tracker to Connected Platform
              </p>
            </div>
          </div>
          {step !== "upload" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleReset}
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Start Over
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        {/* Progress Steps */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 flex items-center justify-center"
        >
          <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)]/60 backdrop-blur-sm px-2 py-1.5">
            {steps.map((s, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={s.key} className="flex items-center">
                  <div
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-all duration-300",
                      isCurrent && "bg-[var(--primary)]/10"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300",
                        isActive
                          ? "bg-[var(--primary)] text-white shadow-sm shadow-blue-500/30"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      )}
                    >
                      {s.num}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors duration-300",
                        isActive
                          ? "text-[var(--foreground)]"
                          : "text-[var(--muted-foreground)]"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={cn(
                        "mx-1 h-px w-8 transition-colors duration-500",
                        i < currentStepIndex
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--border)]"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content with transitions */}
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UploadStep onUpload={handleFileUpload} />
            </motion.div>
          )}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProcessingStep />
            </motion.div>
          )}
          {step === "review" && extractionResult && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReviewStep
                result={extractionResult}
                onGenerate={handleGenerate}
                onBack={() => setStep("upload")}
              />
            </motion.div>
          )}
          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GeneratingStep />
            </motion.div>
          )}
          {step === "download" && downloadUrl && (
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DownloadStep
                url={downloadUrl}
                projectName={extractionResult?.projectName || "output"}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FeedbackButton
        pageState={{
          step,
          projectName: extractionResult?.projectName,
          initiativeCount: extractionResult?.initiatives.length,
          hasChangeReport: !!extractionResult?.changeReport,
          error,
        }}
      />
    </main>
  );
}
