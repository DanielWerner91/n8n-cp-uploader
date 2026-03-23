"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquarePlus, X, Send, Camera, Bug, Lightbulb, HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const feedbackTypes = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-400" },
  { value: "suggestion", label: "Idea", icon: Lightbulb, color: "text-amber-400" },
  { value: "question", label: "Question", icon: HelpCircle, color: "text-blue-400" },
] as const;

interface FeedbackButtonProps {
  pageState?: Record<string, unknown>;
}

export function FeedbackButton({ pageState }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>("bug");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);

    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (screenshot) {
        const fileName = `feedback/${Date.now()}_${screenshot.name}`;
        const { data: uploadData } = await supabase.storage
          .from("cp-uploader")
          .upload(fileName, screenshot);

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("cp-uploader")
            .getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      }

      await supabase.from("cp_uploader_feedback").insert({
        feedback_type: type,
        message: message.trim(),
        user_name: name.trim() || "anonymous",
        screenshot_url: screenshotUrl,
        page_state: pageState || null,
      });

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage("");
        setScreenshot(null);
        setType("bug");
      }, 1500);
    } catch (err) {
      console.error("Feedback submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md px-4 text-sm font-medium text-[var(--muted-foreground)] shadow-lg hover:text-[var(--foreground)] hover:border-[var(--primary)]/30 transition-all"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <MessageSquarePlus className="h-4 w-4" />
        Feedback
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-20 right-5 z-50 w-[380px] rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center p-8 gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20"
                  >
                    <span className="text-green-400 text-xl">&#10003;</span>
                  </motion.div>
                  <p className="text-sm font-medium">Thanks for the feedback!</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                    <h3 className="text-sm font-semibold">Send Feedback</h3>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Name */}
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    />

                    {/* Type selector */}
                    <div className="flex gap-2">
                      {feedbackTypes.map((ft) => (
                        <button
                          key={ft.value}
                          onClick={() => setType(ft.value)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                            type === ft.value
                              ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--foreground)]"
                              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/20"
                          )}
                        >
                          <ft.icon className={cn("h-3.5 w-3.5", type === ft.value ? ft.color : "")} />
                          {ft.label}
                        </button>
                      ))}
                    </div>

                    {/* Message */}
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the issue, idea, or question..."
                      rows={4}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm resize-none focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    />

                    {/* Screenshot */}
                    <div>
                      {screenshot ? (
                        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2">
                          <Camera className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                          <span className="text-xs truncate flex-1">{screenshot.name}</span>
                          <button
                            onClick={() => setScreenshot(null)}
                            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Attach screenshot
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setScreenshot(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="border-t border-[var(--border)] px-4 py-3">
                    <button
                      onClick={handleSubmit}
                      disabled={!message.trim() || submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {submitting ? "Sending..." : "Send Feedback"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
