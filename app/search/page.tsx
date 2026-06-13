"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLedger } from "@/lib/LedgerContext";
import { PROCEDURES } from "@/lib/procedures";
import { calculateRealCost } from "@/lib/costCalculator";
import { Provider } from "@/lib/types";
import { fetchNearbyHospitals, getNetworkStatus } from "@/lib/fetchHospitals";
import seedProviders from "@/data/providers.json";
import ChatPanel from "@/components/ChatPanel";
import HospitalPopupModal from "@/components/HospitalPopupModal";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type ProviderWithCost = Provider & {
  yourCost:       number;
  stickerPrice:   number;
  breakdown:      ReturnType<typeof calculateRealCost>;
  procedureLabel: string;
  cptCode:        string;
  waitDays:       number;
  surpriseCost:   number;
  hasPrice:       boolean;
  inNetwork:      boolean;
};

const SPLIT_H = "calc(100vh - 65px)";

export default function SearchPage() {
  const {
    ledger, amountPaidSoFar, addVisit, setSelectedProviderIds,
    selectedProcedureId, setSelectedProcedureId,
  } = useLedger();

  const [hospitals,     setHospitals]     = useState<Provider[]>(seedProviders as Provider[]);
  const [loading,       setLoading]       = useState(true);
  const [popupProvider, setPopupProvider] = useState<ProviderWithCost | null>(null);
  const [applied,       setApplied]       = useState<ProviderWithCost | null>(null);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [highlightedId,  setHighlightedId]  = useState<string | null>(null);
  const [flyTarget,      setFlyTarget]      = useState<{ lat: number; lng: number } | null>(null);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNearbyHospitals(ledger.location.lat, ledger.location.lng, 60)
      .then((data) => { if (data.length > 0) setHospitals(data); })
      .catch(() => { /* keep seed */ })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Providers shown on map — gray pins if no test selected, colored if test selected
  const mapProviders = useMemo<ProviderWithCost[]>(() => {
    const planKey = ledger.insurance.provider ?? "blue-shield";

    if (!selectedProcedureId) {
      return hospitals.map((p) => {
        const ns = p.networkStatus ?? getNetworkStatus(p.id);
        return {
          ...p,
          yourCost:       -1,
          stickerPrice:   0,
          breakdown:      { stickerPrice: 0, yourCost: 0, insuranceCovers: 0,
                            deductibleRemainingBefore: 0, deductibleRemainingAfter: 0,
                            appliedToDeductible: 0, coinsuranceApplied: 0, hitOopMax: false },
          procedureLabel: "",
          cptCode:        "",
          waitDays:       0,
          surpriseCost:   0,
          hasPrice:       false,
          inNetwork:      ns[planKey] ?? true,
        };
      });
    }

    return hospitals
      .filter((p) => p.procedures[selectedProcedureId])
      .map((p) => {
        const info      = p.procedures[selectedProcedureId];
        const breakdown = calculateRealCost(info.stickerPrice, amountPaidSoFar, ledger.insurance);
        const ns        = p.networkStatus ?? getNetworkStatus(p.id);
        return {
          ...p,
          yourCost:       breakdown.yourCost,
          stickerPrice:   info.stickerPrice,
          breakdown,
          procedureLabel: info.name,
          cptCode:        info.cptCode,
          waitDays:       info.waitDays,
          surpriseCost:   info.surpriseCost ?? 0,
          hasPrice:       true,
          inNetwork:      ns[planKey] ?? true,
        };
      })
      .sort((a, b) => a.yourCost - b.yourCost);
  }, [hospitals, selectedProcedureId, amountPaidSoFar, ledger.insurance]);

  const handlePinClick = (p: ProviderWithCost) => {
    if (p.hasPrice) {
      setPopupProvider(p);
      setHighlightedId(p.id);
    }
  };

  const handleChoose = (provider: ProviderWithCost) => {
    setSelectedProviderIds([provider.id]);
    addVisit({
      date:       new Date().toISOString().slice(0, 10),
      procedure:  provider.procedureLabel,
      provider:   provider.name,
      amountPaid: provider.breakdown.yourCost,
    });
    setApplied(provider);
    setPopupProvider(null);
  };

  const searchResults = useMemo(() => {
    const q = hospitalSearch.trim().toLowerCase();
    if (!q) return [];
    return mapProviders.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [hospitalSearch, mapProviders]);

  const handleHospitalSelect = (p: ProviderWithCost) => {
    setHighlightedId(p.id);
    setFlyTarget({ lat: p.lat, lng: p.lng });
    setHospitalSearch("");
    setShowDropdown(false);
    if (p.hasPrice) setPopupProvider(p);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentProc = PROCEDURES.find((p) => p.id === selectedProcedureId);
  const testSelected = !!selectedProcedureId;

  return (
    <>
      <div style={{ height: SPLIT_H, display: "flex", overflow: "hidden", background: "#fff" }}>

        {/* ── Left: Chat ── */}
        <div style={{
          width: "50%", flexShrink: 0,
          borderRight: "1px solid #e5e7eb",
          display: "flex", flexDirection: "column",
          height: "100%", overflow: "hidden",
        }}>
          <ChatPanel
            procedureId={selectedProcedureId}
            onProcedureChange={(id) => { setSelectedProcedureId(id); setPopupProvider(null); }}
          />
        </div>

        {/* ── Right: Map ── */}
        <div style={{ width: "50%", flexShrink: 0, height: "100%", position: "relative" }}>

          {/* Top badge */}
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 20, padding: "5px 14px",
            fontSize: 12, fontWeight: 600,
            color: loading ? "#9ca3af" : testSelected ? "#16a34a" : "#6b7280",
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {loading && (
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "#16a34a",
                display: "inline-block", animation: "dotBounce 0.9s ease-in-out infinite",
              }} />
            )}
            {loading
              ? "Finding hospitals…"
              : testSelected
                ? `${mapProviders.length} hospital${mapProviders.length !== 1 ? "s" : ""} · ${currentProc?.label.split("–")[0].trim()}`
                : `${mapProviders.length} hospital${mapProviders.length !== 1 ? "s" : ""} nearby`
            }
          </div>

          {/* Hospital search bar */}
          <div ref={searchRef} style={{
            position: "absolute", top: 12, left: 12, zIndex: 10, width: 240,
          }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                fontSize: 14, color: "#9ca3af", pointerEvents: "none",
              }}>
                🔍
              </span>
              <input
                type="text"
                value={hospitalSearch}
                onChange={(e) => { setHospitalSearch(e.target.value); setShowDropdown(true); }}
                onFocus={(e) => { e.target.style.borderColor = "#16a34a"; setShowDropdown(true); }}
                onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb"; }}
                placeholder="Search hospital…"
                style={{
                  width: "100%", padding: "8px 12px 8px 34px",
                  borderRadius: 20, border: "1.5px solid #e5e7eb",
                  background: "#fff", fontSize: 13, fontFamily: "inherit",
                  color: "#111827", outline: "none",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.1)",
                  boxSizing: "border-box",
                }}
              />
              {hospitalSearch && (
                <button
                  onClick={() => { setHospitalSearch(""); setShowDropdown(false); }}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    border: "none", background: "none", cursor: "pointer",
                    color: "#9ca3af", fontSize: 14, lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "#fff", borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                border: "1px solid #e5e7eb",
                maxHeight: 260, overflowY: "auto",
                zIndex: 20,
              }}>
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={() => handleHospitalSelect(p)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "10px 14px", border: "none",
                      background: "none", cursor: "pointer",
                      borderBottom: "1px solid #f3f4f6",
                      display: "block",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {p.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                      {p.hasPrice ? (
                        <>
                          <span style={{ color: p.inNetwork ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {p.inNetwork ? "✓ In-network" : "✗ Out-of-network"}
                          </span>
                          <span>·</span>
                          <span>Your cost: ${Math.round(p.yourCost).toLocaleString()}</span>
                        </>
                      ) : (
                        <span>Search a test to see cost</span>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && hospitalSearch.trim() && searchResults.length === 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "#fff", borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                border: "1px solid #e5e7eb",
                padding: "12px 14px",
                fontSize: 13, color: "#9ca3af",
                zIndex: 20,
              }}>
                No hospitals found for "{hospitalSearch}"
              </div>
            )}
          </div>

          {/* Prompt when no test selected */}
          {!testSelected && !loading && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10, textAlign: "center", pointerEvents: "none",
            }}>
              <div style={{
                background: "rgba(255,255,255,0.92)",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: "16px 24px",
                backdropFilter: "blur(4px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#111827" }}>
                  Search for a test to see costs
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  Type in the chat on the left ←
                </p>
              </div>
            </div>
          )}

          {/* Cost legend — only when test is selected */}
          {testSelected && (
            <div style={{
              position: "absolute", bottom: 56, left: 12, zIndex: 10,
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 12, padding: "10px 14px",
              fontSize: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            }}>
              <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#374151" }}>Your cost</p>
              {[
                { color: "#16a34a", label: "< $200" },
                { color: "#d97706", label: "$200–$500" },
                { color: "#dc2626", label: "> $500" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                  <span style={{ color: "#6b7280" }}>{l.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Data disclaimer */}
          <div style={{
            position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 10,
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 10, padding: "7px 12px",
            fontSize: 11, color: "#92400e", lineHeight: 1.45, textAlign: "center",
          }}>
            <strong>Data source:</strong> Hospital locations from OpenStreetMap. Prices are algorithmic estimates based on national CMS averages — not verified hospital chargemaster data. Always confirm costs with the hospital directly.
          </div>

          <MapView
            providers={mapProviders}
            center={ledger.location}
            onPinClick={handlePinClick}
            selectedId={highlightedId}
            flyTarget={flyTarget}
          />
        </div>
      </div>

      {/* Applied confirmation banner */}
      {applied && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999,
          background: "#16a34a", color: "#fff",
          borderRadius: 14, padding: "14px 20px",
          boxShadow: "0 4px 24px rgba(22,163,74,0.35)",
          display: "flex", alignItems: "center", gap: 14,
          maxWidth: "calc(100vw - 40px)",
          animation: "slideUp 0.25s ease",
        }}>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14 }}>
              ✓ Applied — {applied.name}
            </p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
              {applied.procedureLabel} · Your cost: ${Math.round(applied.breakdown.yourCost).toLocaleString()} · Logged to your HealthLedger
            </p>
          </div>
          <button
            onClick={() => setApplied(null)}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none",
              borderRadius: 8, width: 28, height: 28,
              color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <HospitalPopupModal
        provider={popupProvider}
        planName={ledger.insurance.planName}
        onClose={() => setPopupProvider(null)}
        onChoose={() => popupProvider && handleChoose(popupProvider)}
      />
    </>
  );
}
