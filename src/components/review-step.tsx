"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Pencil,
  Check,
} from "lucide-react";
import type { ExtractionResult, ExtractedInitiative } from "@/lib/types";

interface ReviewStepProps {
  result: ExtractionResult;
  onGenerate: (result: ExtractionResult) => void;
  onBack: () => void;
}

export function ReviewStep({ result, onGenerate, onBack }: ReviewStepProps) {
  const [editedResult, setEditedResult] = useState<ExtractionResult>(result);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
      <div className="mb-6">
        <h2 className="mb-1 text-2xl font-semibold">Review Extracted Data</h2>
        <p className="text-[var(--muted-foreground)]">
          {editedResult.initiatives.length} initiatives extracted from{" "}
          <span className="font-medium text-[var(--foreground)]">
            {editedResult.projectName}
          </span>
          . Review and edit before generating the CP upload file.
        </p>
      </div>

      {/* Warnings */}
      {editedResult.warnings.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            Warnings
          </div>
          <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            {editedResult.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing IDs alert */}
      {missingIds.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{missingIds.length} initiative(s)</strong> are missing CP
            Initiative IDs. You can add them below, or leave blank and fill them
            in the downloaded file.
          </p>
        </div>
      )}

      {/* Initiatives list */}
      <div className="space-y-3">
        {editedResult.initiatives.map((initiative) => (
          <InitiativeCard
            key={initiative.id}
            initiative={initiative}
            isExpanded={expandedIds.has(initiative.id)}
            onToggle={() => toggleExpanded(initiative.id)}
            onUpdate={(updates) => updateInitiative(initiative.id, updates)}
            onRemove={() => removeInitiative(initiative.id)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-lg px-4 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          Back to Upload
        </button>
        <button
          onClick={() => onGenerate(editedResult)}
          disabled={editedResult.initiatives.length === 0}
          className="rounded-lg bg-[var(--primary)] px-6 py-2.5 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          Generate CP Upload File
        </button>
      </div>
    </div>
  );
}

function InitiativeCard({
  initiative,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
}: {
  initiative: ExtractedInitiative;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<ExtractedInitiative>) => void;
  onRemove: () => void;
}) {
  const [editingId, setEditingId] = useState(false);
  const [idValue, setIdValue] = useState(initiative.cpInitiativeId);
  const hasId = initiative.cpInitiativeId.trim().length > 0;

  const saveId = () => {
    onUpdate({ cpInitiativeId: idValue.trim() });
    setEditingId(false);
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggle}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{initiative.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                initiative.status === "Complete"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : initiative.status === "Active"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : initiative.status === "Cancelled"
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {initiative.status}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span>{initiative.division}</span>
            <span>
              {initiative.l1Category}
              {initiative.l2Category ? ` > ${initiative.l2Category}` : ""}
            </span>
            <span>
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
                className="w-64 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-mono"
                onKeyDown={(e) => e.key === "Enter" && saveId()}
                autoFocus
              />
              <button
                onClick={saveId}
                className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingId(true)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                hasId
                  ? "font-mono text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  : "border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
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
          className="rounded p-1 text-xs text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          title="Remove initiative"
        >
          &times;
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Name
              </label>
              <input
                type="text"
                value={initiative.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Status
              </label>
              <select
                value={initiative.status}
                onChange={(e) => onUpdate({ status: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              >
                <option>Complete</option>
                <option>Active</option>
                <option>Cancelled</option>
                <option>Pilot / Ramp up</option>
                <option>Track</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Methodology
              </label>
              <select
                value={initiative.methodology}
                onChange={(e) => onUpdate({ methodology: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              >
                <option>Complex Sourcing</option>
                <option>Simple Sourcing</option>
                <option>Demand Management</option>
                <option>Project CP Set-up and Management</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Owner Email
              </label>
              <input
                type="email"
                value={initiative.ownerEmail}
                onChange={(e) => onUpdate({ ownerEmail: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Profiles */}
          {initiative.profiles.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Savings Profiles ({initiative.profiles.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                      <th className="pb-2 pr-3 font-medium">Profile</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Methodology</th>
                      <th className="pb-2 pr-3 font-medium text-right">
                        Annualised Savings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {initiative.profiles.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="py-2 pr-3">{p.profileName}</td>
                        <td className="py-2 pr-3">{p.status}</td>
                        <td className="py-2 pr-3">{p.savingsMethodology}</td>
                        <td className="py-2 pr-3 text-right font-mono">
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
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Baseline
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[var(--muted-foreground)]">Name:</span>{" "}
                  {initiative.baseline.baselineName}
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">
                    Annualised:
                  </span>{" "}
                  <span className="font-mono">
                    ${initiative.baseline.annualisedBaseline.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">
                    Expenditure:
                  </span>{" "}
                  {initiative.baseline.expenditure}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
