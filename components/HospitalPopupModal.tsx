"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CostBreakdown } from "@/lib/costCalculator";

interface PopupProvider {
  id: string;
  name: string;
  address: string;
  yourCost: number;
  stickerPrice: number;
  breakdown: CostBreakdown;
  procedureLabel: string;
  cptCode: string;
  waitDays: number;
  surpriseCost: number;
  inNetwork: boolean;
  reviewFlag: { type: string; summary: string; sourceCount: number };
}

interface Props {
  provider: PopupProvider | null;
  planName: string;
  onClose: () => void;
  onChoose: () => void;
}

const REVIEW_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  ok:      { bg: "#f0fdf4", text: "#15803d", icon: "✓" },
  warning: { bg: "#fffbeb", text: "#92400e", icon: "⚠" },
  danger:  { bg: "#fff1f2", text: "#be123c", icon: "⚠" },
};

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

export default function HospitalPopupModal({ provider, planName, onClose, onChoose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!provider || !mounted) return null;

  const { breakdown, reviewFlag, surpriseCost, inNetwork } = provider;
  const rv = REVIEW_STYLES[reviewFlag.type] ?? REVIEW_STYLES.ok;

  const deductibleApplied = breakdown.appliedToDeductible;
  const afterDeductible   = breakdown.stickerPrice - deductibleApplied;
  const insurancePays     = breakdown.insuranceCovers;
  const youPayCoinsurance = breakdown.coinsuranceApplied;
  const deductibleWasMet  = deductibleApplied === 0;
  const deductibleCoversAll = deductibleApplied >= breakdown.stickerPrice - 0.01;

  // Derive the coinsurance % that insurance covers (e.g. 80)
  const insurancePct = afterDeductible > 0
    ? Math.round((insurancePays / afterDeductible) * 100)
    : 0;
  const yourPct = 100 - insurancePct;

  const modal = (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card" style={{ maxHeight: "90vh", overflowY: "auto" }}>

        {/* ── Header ── */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 3px", lineHeight: 1.3 }}>
              {provider.name}
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>📍 {provider.address}</p>
          </div>
          <button onClick={onClose} style={{
            background: "#f3f4f6", border: "none", borderRadius: 8,
            width: 30, height: 30, cursor: "pointer", fontSize: 15, color: "#6b7280",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            ✕
          </button>
        </div>

        {/* ── Procedure + network badge ── */}
        <div style={{
          padding: "9px 20px", background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
              {provider.procedureLabel}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              CPT {provider.cptCode} · {provider.waitDays}d wait
            </span>
          </div>
          {/* Network status badge */}
          {inNetwork ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 20, padding: "3px 10px",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>
                In-network · {planName}
              </span>
            </div>
          ) : (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#fff1f2", border: "1px solid #fecdd3",
              borderRadius: 20, padding: "3px 10px",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#be123c" }}>
                Out-of-network · costs may be higher
              </span>
            </div>
          )}
        </div>

        {/* ── Cost breakdown ── */}
        <div style={{ padding: "14px 18px 4px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
            How your cost is calculated
          </p>

          {/* Step 1: Hospital charges */}
          <div style={{
            background: "#f9fafb", borderRadius: 10, padding: "10px 14px", marginBottom: 6,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Hospital charges</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmt(breakdown.stickerPrice)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
              Listed price before insurance
            </p>
          </div>

          {/* Step 2: Deductible */}
          {deductibleWasMet ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px", borderRadius: 10, background: "#f0fdf4",
              border: "1px solid #bbf7d0", marginBottom: 6,
            }}>
              <div>
                <span style={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>Deductible fully met ✓</span>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#86efac" }}>Your deductible is paid for this year</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>$0</span>
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px", borderRadius: 10, background: "#fffbeb",
              border: "1px solid #fde68a", marginBottom: 6,
            }}>
              <div>
                <span style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>
                  You pay toward deductible
                </span>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#b45309" }}>
                  {deductibleCoversAll
                    ? "Full cost goes to your deductible — insurance not yet active"
                    : `$${Math.round(breakdown.deductibleRemainingBefore)} of your deductible remained`}
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
                {fmt(deductibleApplied)}
              </span>
            </div>
          )}

          {/* Step 3: After deductible split — only if insurance pays something */}
          {!deductibleCoversAll && afterDeductible > 0 && (
            <>
              <div style={{
                padding: "6px 14px", borderRadius: 10, background: "#fff",
                border: "1px solid #e5e7eb", marginBottom: 4,
              }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                  After deductible ({fmt(afterDeductible)} remaining)
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#15803d" }}>
                    🛡 Insurance pays ({insurancePct}%)
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                    {fmt(insurancePays)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    You pay ({yourPct}% coinsurance)
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                    {fmt(youPayCoinsurance)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* OOP max hit notice */}
          {breakdown.hitOopMax && (
            <div style={{
              padding: "8px 14px", borderRadius: 10, background: "#f0fdf4",
              border: "1px solid #bbf7d0", marginBottom: 6,
            }}>
              <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                ✓ Out-of-pocket maximum reached — insurance covers 100% of the rest this year
              </span>
            </div>
          )}

          {/* Surprise fees */}
          {surpriseCost > 0 ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px", borderRadius: 10, background: "#fffbeb",
              border: "1px solid #fde68a", marginBottom: 6,
            }}>
              <div>
                <span style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>⚠ Potential surprise fees</span>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#b45309" }}>
                  Out-of-network specialist or facility fee
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>+{fmt(surpriseCost)}</span>
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px", borderRadius: 10, marginBottom: 6,
            }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Surprise / hidden fees</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>None ✓</span>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: "2px dashed #e5e7eb", margin: "10px 0 12px" }} />

          {/* Total row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#f0fdf4", borderRadius: 12,
            padding: "12px 16px", marginBottom: 10,
            border: "1.5px solid #bbf7d0",
          }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Your total cost
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                {deductibleApplied > 0 && !deductibleCoversAll
                  ? `${fmt(deductibleApplied)} deductible + ${fmt(youPayCoinsurance)} coinsurance`
                  : deductibleCoversAll
                    ? "Full amount applies to your deductible"
                    : `${fmt(youPayCoinsurance)} coinsurance only`}
              </p>
            </div>
            <span style={{ fontSize: 30, fontWeight: 800, color: "#16a34a", letterSpacing: -1 }}>
              {fmt(breakdown.yourCost)}
            </span>
          </div>

          {/* Insurance covers */}
          {insurancePays > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px", borderRadius: 10, background: "#f9fafb",
              border: "1px solid #e5e7eb", marginBottom: 10,
            }}>
              <span style={{ fontSize: 13, color: "#374151" }}>🛡 Insurance covers</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{fmt(insurancePays)}</span>
            </div>
          )}

          {/* In-network note */}
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
            Cost assumes in-network rates. Call your insurer to confirm this hospital accepts your plan before booking.
          </p>

          {/* Review note */}
          <div style={{
            background: rv.bg, borderRadius: 10, padding: "9px 13px",
            fontSize: 12, color: rv.text, lineHeight: 1.5, marginBottom: 4,
          }}>
            <span style={{ fontWeight: 700 }}>{rv.icon} </span>
            {reviewFlag.summary}{" "}
            <span style={{ opacity: 0.6 }}>({reviewFlag.sourceCount} reviews)</span>
          </div>
        </div>

        {/* ── Buttons ── */}
        <div style={{
          padding: "12px 18px 18px",
          display: "flex", gap: 10,
          borderTop: "1px solid #f3f4f6",
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            border: "1.5px solid #e5e7eb", background: "#fff",
            color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            Close
          </button>
          <button onClick={onChoose} style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            border: "none", background: "#16a34a",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
          }}>
            Apply →
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
