"use client";

import { motion } from "motion/react";
import { Brain } from "lucide-react";

export function ProcessingStep() {
  return (
    <div className="mx-auto max-w-md text-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8 flex justify-center"
      >
        <div className="relative">
          {/* Pulsing rings */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-blue-500/20"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
            className="absolute inset-0 rounded-full bg-blue-500/10"
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-blue-500/30 animate-pulse-glow">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Brain className="h-9 w-9 text-blue-400" />
            </motion.div>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Analyzing Your Tracker
        </h2>
        <p className="text-[var(--muted-foreground)] leading-relaxed">
          AI is reading your spreadsheet and extracting initiatives, savings
          data, baselines, and profiles. This may take 30-60 seconds.
        </p>
      </motion.div>
      {/* Progress dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex justify-center gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="h-2 w-2 rounded-full bg-[var(--primary)]"
          />
        ))}
      </motion.div>
    </div>
  );
}
