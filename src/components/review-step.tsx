"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Info,
  GitMerge,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import type { ExtractionResult, ExtractedInitiative, ChangeReport } from "@/lib/types";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
  result: ExtractionResult;
  onGenerate: (result: ExtractionResult) => void;
  onBack: () => void;
}

export function ReviewStep({ result, onGenerate, onBack }: ReviewStepProps) {
  const [editedResult, setEditedResult] = useState<ExtractionResult>(result);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [changeReportOpen, setChangeReportOpen] = useState(true);

  const isMergeMode = !!editedResult.changeReport;

  const missingIds = editedResult.initiatives.filter(
    (i) => !i.cpInitiativeId.trim()
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateInitiative = (
    id: string,
    updates: Partial<ExtractedInitiative>
  ) => {
    setEditedResult((prev) => ({
      ...prev,
      initiatives: prev.initiatives.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));
  };

  const removeInitiative = (id: string) => {
    setEditedResult((prev) => ({
      ...prev,
      initiatives: prev.initiatives.filter((i) => i.id !== id),
    }));
  };

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          Review{" "}
          <span className="gradient-text">
            {isMergeMode ? "Merged Data" : "Extracted Data"}
          </span>
        </h2>
        <p className="text-[var(--muted-foreground)]">
          <span className="font-semibold text-[var(--foreground)]">
            {editedResult.initiatives.length} initiatives
          </span>{" "}
          {isMergeMode ? "after merge for" : "extracted from"}{" "}
          <span className="font-semibold text-[var(--foreground)]">
            {editedResult.projectName}
          </span>
          . Review and edit before generating the CP upload file.
        </p>
      </motion.div>

      {/* Warnings */}
      <AnimatePresence>
        {editedResult.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 overflow-hidden rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </div>
            <ul className="space-y-1 text-sm text-yellow-300/80">
              {editedResult.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Report */}
      {isMergeMode && editedResult.changeReport && (
        <ChangeReportSection
          report={editedResult.changeReport}
          isOpen={changeReportOpen}
          onToggle={() => setChangeReportOpen((v) => !v)}
        />
      )}

      {/* Missing IDs alert */}
      {missingIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3"
        >
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-300/90">
            <strong>{missingIds.length} initiative(s)</strong> are missing CP
            Initiative IDs. You can add them below, or leave blank and fill them
            in the downloaded file.
          </p>
        </motion.div>
      )}

      {/* Initiatives list */}
      <div className="space-y-3">
        {editedResult.initiatives.map((initiative, index) => (
          <motion.div
            key={initiative.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * Math.min(index, 10) }}
          >
            <InitiativeCard
              initiative={initiative}
              isExpanded={expandedIds.has(initiative.id)}
              onToggle={() => toggleExpanded(initiative.id)}
              onUpdate={(updates) => updateInitiative(initiative.id, updates)}
              onRemove={() => removeInitiative(initiative.id)}
              mergeStatus={getMergeStatus(initiative.id, editedResult.changeReport)}
            />
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex items-center justify-between"
      >
        <button
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm text-[var(--muted-foreground)] transition-all hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
        >
          Back to Upload
        </button>
        <ShimmerButton
          onClick={() => onGenerate(editedResult)}
          disabled={editedResult.initiatives.length === 0}
          shimmerColor="#60a5fa"
          background="rgba(59, 130, 246, 0.9)"
          borderRadius="12px"
          className="text-sm font-semibold !text-white disabled:opacity-50"
        >
          Generate CP Upload File
        </ShimmerButton>
      </motion.div>
    </div>
  );
}

function InitiativeCard({
  initiative,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  mergeStatus,
}: {
  initiative: ExtractedInitiative;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<ExtractedInitiative>) => void;
  onRemove: () => void;
  mergeStatus?: "updated" | "added" | "unchanged";
}) {
  const [editingId, setEditingId] = useState(false);
  const [idValue, setIdValue] = useState(initiative.cpInitiativeId);
  const hasId = initiative.cpInitiativeId.trim().length > 0;

  const saveId = () => {
    onUpdate({ cpInitiativeId: idValue.trim() });
    setEditingId(false);
  };

  const statusColor = {
    Complete:
      "bg-green-500/10 text-green-400 ring-1 ring-green-500/20",
    Active:
      "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
    Cancelled:
      "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  }[initiative.status] ||
    "bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm transition-all hover:border-[var(--primary)]/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggle}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{initiative.name}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                statusColor
              )}
            >
              {initiative.status}
            </span>
            {mergeStatus && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  mergeStatus === "updated" && "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
                  mergeStatus === "added" && "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
                  mergeStatus === "unchanged" && "bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20"
                )}
              >
                {mergeStatus}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            {initiative.division && <span>{initiative.division}</span>}
            {initiative.l1Category && (
              <span>
                {initiative.l1Category}
                {initiative.l2Category ? ` > ${initiative.l2Category}` : ""}
              </span>
            )}
            <span className="text-[var(--primary)]">
              {initiative.profiles.length} profile(s)
            </span>
          </div>
        </div>

        {/* CP Initiative ID */}
        <div className="flex items-center gap-2">
          {editingId ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                placeholder="Paste CP Initiative ID"
                className="w-64 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-mono focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                onKeyDown={(e) => e.key === "Enter" && saveId()}
                autoFocus
              />
              <button
                onClick={saveId}
                className="rounded-lg p-1.5 text-green-400 hover:bg-green-500/10 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingId(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all",
                hasId
                  ? "font-mono text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  : "border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              )}
            >
              {hasId ? (
                <>
                  {initiative.cpInitiativeId.slice(0, 8)}...
                  <Pencil className="h-3 w-3" />
                </>
              ) : (
                <>
                  <Pencil className="h-3 w-3" />
                  Add CP ID
                </>
              )}
            </button>
          )}
        </div>

        <button
          onClick={onRemove}
          className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          title="Remove initiative"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] px-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    value={initiative.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={initiative.status}
                    onChange={(e) => onUpdate({ status: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option>Complete</option>
                    <option>Active</option>
                    <option>Cancelled</option>
                    <option>Pilot / Ramp up</option>
                    <option>Track</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Methodology
                  </label>
                  <select
                    value={initiative.methodology}
                    onChange={(e) =>
                      onUpdate({ methodology: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option>Complex Sourcing</option>
                    <option>Simple Sourcing</option>
                    <option>Demand Management</option>
                    <option>Project CP Set-up and Management</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    value={initiative.ownerEmail}
                    onChange={(e) =>
                      onUpdate({ ownerEmail: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              {/* Profiles */}
              {initiative.profiles.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Savings Profiles ({initiative.profiles.length})
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
                          <th className="px-3 py-2.5 font-medium">Profile</th>
                          <th className="px-3 py-2.5 font-medium">Status</th>
                          <th className="px-3 py-2.5 font-medium">
                            Methodology
                          </th>
                          <th className="px-3 py-2.5 font-medium text-right">
                            Annualised Savings
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {initiative.profiles.map((p, i) => (
                          <tr
                            key={i}
                            className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors"
                          >
                            <td className="px-3 py-2.5">{p.profileName}</td>
                            <td className="px-3 py-2.5">{p.status}</td>
                            <td className="px-3 py-2.5">
                              {p.savingsMethodology}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-[var(--foreground)]">
                              ${p.annualisedSavings.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Baseline */}
              {initiative.baseline && (
                <div className="mt-5">
                  <h4 className="mb-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Baseline
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        label: "Name",
                        value: initiative.baseline.baselineName,
                      },
                      {
                        label: "Annualised",
                        value: `$${initiative.baseline.annualisedBaseline.toLocaleString()}`,
                        mono: true,
                      },
                      {
                        label: "Expenditure",
                        value: initiative.baseline.expenditure,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg bg-[var(--muted)]/50 p-3"
                      >
                        <p className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                          {item.label}
                        </p>
                        <p
                          className={cn(
                            "text-sm",
                            item.mono && "font-mono"
                          )}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getMergeStatus(
  initiativeId: string,
  changeReport?: ChangeReport
): "updated" | "added" | "unchanged" | undefined {
  if (!changeReport) return undefined;
  if (changeReport.matched.some((m) => m.initiativeId === initiativeId)) return "updated";
  if (changeReport.added.some((a) => a.initiativeId === initiativeId)) return "added";
  if (changeReport.unchanged.some((u) => u.initiativeId === initiativeId)) return "unchanged";
  return undefined;
}

function ChangeReportSection({
  report,
  isOpen,
  onToggle,
}: {
  report: ChangeReport;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const totalUpdatedFields = report.matched.reduce((sum, m) => sum + m.changes.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 overflow-hidden"
    >
      {/* Summary bar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--primary)]/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-[var(--primary)]" />
          <span className="text-sm font-semibold">Merge Report</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {report.matched.length > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <ArrowRight className="h-3 w-3" />
              {report.matched.length} updated ({totalUpdatedFields} fields)
            </span>
          )}
          {report.added.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Plus className="h-3 w-3" />
              {report.added.length} added
            </span>
          )}
          {report.unchanged.length > 0 && (
            <span className="text-[var(--muted-foreground)]">
              {report.unchanged.length} unchanged
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] px-4 py-3 space-y-4">
              {/* Updated initiatives */}
              {report.matched.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3" />
                    Updated
                  </h4>
                  <div className="space-y-2">
                    {report.matched.map((match) => (
                      <div
                        key={match.initiativeId}
                        className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3"
                      >
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="text-[var(--muted-foreground)]">
                            {match.trackerName}
                          </span>
                          <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
                          <span className="font-medium">{match.cpName}</span>
                          {match.confidence !== "high" && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                                match.confidence === "medium"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-red-500/10 text-red-400"
                              )}
                            >
                              {match.confidence} confidence
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {match.changes.map((change, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs font-mono"
                            >
                              <span className="text-[var(--muted-foreground)] min-w-[140px]">
                                {change.field}
                              </span>
                              <span className="text-red-400/70 line-through">
                                {formatValue(change.from)}
                              </span>
                              <ArrowRight className="h-2.5 w-2.5 text-[var(--muted-foreground)]" />
                              <span className="text-emerald-400">
                                {formatValue(change.to)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Added initiatives */}
              {report.added.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Plus className="h-3 w-3" />
                    Added from Tracker
                  </h4>
                  <div className="space-y-1">
                    {report.added.map((item) => (
                      <div
                        key={item.initiativeId}
                        className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2 text-sm"
                      >
                        <Plus className="h-3 w-3 text-emerald-400" />
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unchanged initiatives */}
              {report.unchanged.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Minus className="h-3 w-3" />
                    Unchanged
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {report.unchanged.map((item) => (
                      <span
                        key={item.initiativeId}
                        className="rounded-md bg-[var(--muted)]/50 px-2 py-1 text-xs text-[var(--muted-foreground)]"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatValue(val: string | number | null): string {
  if (val === null || val === undefined || val === "") return "(empty)";
  if (typeof val === "number") return `$${val.toLocaleString()}`;
  return String(val);
}
