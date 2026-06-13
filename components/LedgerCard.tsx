"use client";

import { useLedger } from "@/lib/LedgerContext";

export default function LedgerCard() {
  const { ledger, amountPaidSoFar, deductibleRemaining } = useLedger();
  const { insurance, visits } = ledger;

  const pct = Math.min(
    Math.round((amountPaidSoFar / insurance.deductible) * 100),
    100
  );

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Your Deductible — {insurance.planName}</h2>
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>
          2026
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
          ${amountPaidSoFar.toLocaleString()}
        </span>
        <span style={{ color: "var(--color-muted)" }}>
          / ${insurance.deductible.toLocaleString()} met
        </span>
      </div>

      <div
        className="w-full h-3 rounded-full overflow-hidden mb-2"
        style={{ background: "#e5e7eb" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: "var(--color-primary)",
          }}
        />
      </div>

      <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
        {deductibleRemaining > 0 ? (
          <>
            Only <strong>${deductibleRemaining.toLocaleString()}</strong> left before your
            insurance starts covering most costs.
          </>
        ) : (
          <>You&apos;ve met your deductible — insurance now covers most additional costs.</>
        )}
      </p>

      <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-muted)" }}>
        Visits this year
      </h3>
      <div className="flex flex-col gap-2">
        {visits.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "#f7f8fa" }}
          >
            <div>
              <p className="font-medium text-sm">{v.procedure}</p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                {v.provider} · {new Date(v.date).toLocaleDateString()}
              </p>
            </div>
            <span className="font-semibold text-sm">${v.amountPaid.toLocaleString()}</span>
          </div>
        ))}
        {visits.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            No visits logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
