"use client";

import { useState } from "react";
import { Provider } from "@/lib/types";
import { CostBreakdown } from "@/lib/costCalculator";

interface ProviderWithCost extends Provider {
  yourCost: number;
  breakdown: CostBreakdown;
  procedureLabel: string;
  cptCode: string;
  waitDays: number;
}

interface ProviderDetailCardProps {
  provider: ProviderWithCost;
  onClose: () => void;
  onCompare: () => void;
  onChoose: () => void;
  isComparing?: boolean;
}

const flagStyles: Record<string, { bg: string; color: string; icon: string }> = {
  ok: { bg: "#e8f7ee", color: "var(--color-success)", icon: "✅" },
  warning: { bg: "#fef6e7", color: "var(--color-warning)", icon: "⚠️" },
  danger: { bg: "#fdecec", color: "var(--color-danger)", icon: "🚨" },
};

export default function ProviderDetailCard({
  provider,
  onClose,
  onCompare,
  onChoose,
  isComparing,
}: ProviderDetailCardProps) {
  const { breakdown, reviewFlag } = provider;
  const flagStyle = flagStyles[reviewFlag.type];
  const savings = breakdown.stickerPrice - breakdown.yourCost;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-lg leading-tight">{provider.name}</h3>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            {provider.address}
          </p>
        </div>
        {!isComparing && (
          <button onClick={onClose} className="btn-ghost text-sm">
            ✕
          </button>
        )}
      </div>

      <p className="text-sm font-medium mb-3" style={{ color: "var(--color-muted)" }}>
        {provider.procedureLabel} · CPT {provider.cptCode}
      </p>

      <div className="flex items-end gap-3 mb-1">
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            Sticker price
          </p>
          <p
            className="text-xl font-semibold"
            style={{ textDecoration: "line-through", color: "var(--color-muted)" }}
          >
            ${breakdown.stickerPrice.toLocaleString()}
          </p>
        </div>
        <div className="text-2xl" style={{ color: "var(--color-muted)" }}>
          →
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            Your real cost
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
            ${breakdown.yourCost.toLocaleString()}
          </p>
        </div>
      </div>

      {savings > 0 && (
        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-success)" }}>
          Insurance covers ${breakdown.insuranceCovers.toLocaleString()} — you save $
          {savings.toLocaleString()} vs. sticker price.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="p-2 rounded-lg" style={{ background: "#f7f8fa" }}>
          <p style={{ color: "var(--color-muted)" }}>Deductible remaining after</p>
          <p className="font-semibold">${breakdown.deductibleRemainingAfter.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: "#f7f8fa" }}>
          <p style={{ color: "var(--color-muted)" }}>Estimated wait</p>
          <p className="font-semibold">{provider.waitDays} day(s)</p>
        </div>
      </div>

      <div
        className="rounded-lg p-3 text-sm mb-4 flex gap-2"
        style={{ background: flagStyle.bg, color: flagStyle.color }}
      >
        <span>{flagStyle.icon}</span>
        <span>
          {reviewFlag.summary}{" "}
          <span style={{ opacity: 0.7 }}>
            (based on {reviewFlag.sourceCount} patient reviews)
          </span>
        </span>
      </div>

      <div className="flex gap-2">
        {!isComparing && (
          <>
            <button onClick={onClose} className="btn-ghost flex-1">
              Close
            </button>
            <button onClick={onCompare} className="btn-secondary flex-1">
              Compare
            </button>
          </>
        )}
        <button onClick={onChoose} className="btn-primary flex-1">
          Choose this
        </button>
      </div>
    </div>
  );
}
