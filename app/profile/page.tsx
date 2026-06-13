"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLedger } from "@/lib/LedgerContext";
import { DEMO_PLANS } from "@/lib/fetchHospitals";

type FieldKey = "name" | "deductible" | "coinsurance" | "oopMax";

export default function ProfilePage() {
  const { ledger, updateProfile } = useLedger();
  const router = useRouter();

  const isDemo = ledger.userName === "Demo User";

  // Find which demo plan matches the saved one (if any)
  const savedPlanKey = ledger.insurance.provider ?? "blue-shield";
  const [planKey,    setPlanKey]    = useState(savedPlanKey);
  const [name,       setName]       = useState(isDemo ? "" : ledger.userName);
  const [deductible, setDeductible] = useState(String(ledger.insurance.deductible));
  const [coinsurance,setCoinsurance]= useState(String(Math.round(ledger.insurance.coinsurance * 100)));
  const [oopMax,     setOopMax]     = useState(String(ledger.insurance.outOfPocketMax));
  const [errors,     setErrors]     = useState<Partial<Record<FieldKey, string>>>({});
  const [saved,      setSaved]      = useState(false);

  const activePlan = DEMO_PLANS.find((p) => p.key === planKey) ?? DEMO_PLANS[0];

  const handlePlanChange = (key: string) => {
    const plan = DEMO_PLANS.find((p) => p.key === key);
    if (!plan) return;
    setPlanKey(key);
    setDeductible(String(plan.deductible));
    setCoinsurance(String(Math.round(plan.coinsurance * 100)));
    setOopMax(String(plan.outOfPocketMax));
  };

  const validate = () => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) e.name = "Please enter your name";
    const ded  = parseFloat(deductible);
    const coin = parseFloat(coinsurance);
    const oop  = parseFloat(oopMax);
    if (isNaN(ded)  || ded < 0)              e.deductible  = "Enter a valid amount";
    if (isNaN(coin) || coin < 0 || coin > 100) e.coinsurance = "Enter 0–100";
    if (isNaN(oop)  || oop < 0)              e.oopMax      = "Enter a valid amount";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    updateProfile(name.trim(), {
      planName:       activePlan.name,
      provider:       planKey,
      deductible:     parseFloat(deductible),
      coinsurance:    parseFloat(coinsurance) / 100,
      outOfPocketMax: parseFloat(oopMax),
    });
    setSaved(true);
    setTimeout(() => router.push("/search"), 800);
  };

  const S = {
    page: {
      minHeight: "calc(100vh - 65px)",
      background: "#f0fdf4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
    } as React.CSSProperties,
    card: {
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      width: "100%",
      maxWidth: 480,
      overflow: "hidden",
    } as React.CSSProperties,
    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "#374151",
      marginBottom: 6,
    } as React.CSSProperties,
    group: { marginBottom: 18 } as React.CSSProperties,
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    } as React.CSSProperties,
    prefixWrap: { position: "relative" } as React.CSSProperties,
    prefix: {
      position: "absolute", left: 12, top: "50%",
      transform: "translateY(-50%)",
      fontSize: 14, color: "#6b7280", pointerEvents: "none",
    } as React.CSSProperties,
    suffix: {
      position: "absolute", right: 12, top: "50%",
      transform: "translateY(-50%)",
      fontSize: 14, color: "#6b7280", pointerEvents: "none",
    } as React.CSSProperties,
    errorMsg: { fontSize: 12, color: "#dc2626", marginTop: 4 } as React.CSSProperties,
    inputErr: { borderColor: "#dc2626", background: "#fef2f2" } as React.CSSProperties,
  };

  const numInput = (
    key: FieldKey,
    value: string,
    onChange: (v: string) => void,
    prefix?: string,
    suffix?: string,
    placeholder?: string
  ) => (
    <div style={prefix || suffix ? S.prefixWrap : undefined}>
      {prefix && <span style={S.prefix}>{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
        style={{
          ...(prefix ? { paddingLeft: 28 } : {}),
          ...(suffix ? { paddingRight: 40 } : {}),
          ...(errors[key] ? S.inputErr : {}),
        }}
      />
      {suffix && <span style={S.suffix}>{suffix}</span>}
      {errors[key] && <p style={S.errorMsg}>{errors[key]}</p>}
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Header */}
        <div style={{
          background: "#f0fdf4", borderBottom: "1px solid #dcfce7",
          padding: "24px 28px 20px",
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>
            Setup
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            Your Insurance Details
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            We use this to calculate your real out-of-pocket cost and check which hospitals are in your network.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 28px 24px" }}>

          {/* Name */}
          <div style={S.group}>
            <label style={S.label}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="form-input"
              style={errors.name ? S.inputErr : {}}
            />
            {errors.name && <p style={S.errorMsg}>{errors.name}</p>}
          </div>

          {/* Plan picker */}
          <div style={S.group}>
            <label style={S.label}>Insurance Plan</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {DEMO_PLANS.map((plan) => {
                const active = planKey === plan.key;
                return (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => handlePlanChange(plan.key)}
                    style={{
                      border: `2px solid ${active ? "#16a34a" : "#e5e7eb"}`,
                      borderRadius: 12,
                      background: active ? "#f0fdf4" : "#fff",
                      padding: "12px 14px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {active && (
                      <span style={{
                        display: "inline-block", marginBottom: 4,
                        fontSize: 10, fontWeight: 700, color: "#fff",
                        background: "#16a34a", borderRadius: 6, padding: "2px 7px",
                      }}>
                        Selected
                      </span>
                    )}
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                      {plan.name}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b7280" }}>
                      {Math.round(plan.coinsurance * 100)}% coinsurance · ${plan.deductible.toLocaleString()} deductible
                    </p>
                  </button>
                );
              })}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9ca3af" }}>
              These are demo plans — network coverage shown for illustration only.
            </p>
          </div>

          {/* Plan details (editable) */}
          <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 16px 4px", marginBottom: 18 }}>
            <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Plan details (editable)
            </p>
            <div style={S.row}>
              <div style={S.group}>
                <label style={S.label}>Annual deductible</label>
                {numInput("deductible", deductible, setDeductible, "$", undefined, "1500")}
              </div>
              <div style={S.group}>
                <label style={S.label}>Coinsurance</label>
                {numInput("coinsurance", coinsurance, setCoinsurance, undefined, "%", "20")}
              </div>
            </div>
            <div style={S.group}>
              <label style={S.label}>Out-of-pocket maximum</label>
              {numInput("oopMax", oopMax, setOopMax, "$", undefined, "6000")}
            </div>
          </div>

          {/* How it works */}
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 10, padding: "12px 14px", marginBottom: 24,
            fontSize: 13, color: "#374151", lineHeight: 1.55,
          }}>
            <strong style={{ color: "#15803d" }}>How your cost is calculated:</strong>{" "}
            You pay your remaining deductible first, then your coinsurance % on the rest, capped at your OOP max. We also show which hospitals are in-network for your plan.
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              width: "100%", background: saved ? "#15803d" : "#16a34a",
              color: "#fff", fontWeight: 700, fontSize: 15,
              padding: "13px 0", borderRadius: 12, border: "none",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}
          >
            {saved ? "✓  Saved! Taking you to the app…" : "Save & Continue →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 12, marginBottom: 0 }}>
            Your data is stored locally on your device only.
          </p>
        </div>
      </div>
    </div>
  );
}
