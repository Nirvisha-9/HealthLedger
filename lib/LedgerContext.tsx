"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import userLedgerSeed from "@/data/userLedger.json";
import { totalPaidSoFar, Insurance } from "@/lib/costCalculator";

export interface Visit {
  id: string;
  date: string;
  procedure: string;
  provider: string;
  amountPaid: number;
}

export interface LedgerState {
  userName: string;
  location: { lat: number; lng: number; label: string };
  insurance: Insurance;
  visits: Visit[];
}

interface LedgerContextValue {
  ledger: LedgerState;
  amountPaidSoFar: number;
  deductibleRemaining: number;
  addVisit: (visit: Omit<Visit, "id">) => void;
  resetLedger: () => void;
  updateProfile: (userName: string, insurance: Insurance) => void;
  selectedProcedureId: string;
  setSelectedProcedureId: (id: string) => void;
  selectedProviderIds: string[];
  setSelectedProviderIds: (ids: string[]) => void;
}

const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

const STORAGE_KEY = "healthledger-state";

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [ledger, setLedger] = useState<LedgerState>(userLedgerSeed as LedgerState);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>("");
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLedger(JSON.parse(stored));
      } catch {
        // ignore corrupt storage
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  }, [ledger]);

  const addVisit = (visit: Omit<Visit, "id">) => {
    setLedger((prev) => ({
      ...prev,
      visits: [
        ...prev.visits,
        { ...visit, id: `v${prev.visits.length + 1}-${Date.now()}` },
      ],
    }));
  };

  const resetLedger = () => {
    setLedger(userLedgerSeed as LedgerState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = (userName: string, insurance: Insurance) => {
    setLedger((prev) => ({ ...prev, userName, insurance }));
  };

  const paid = totalPaidSoFar(ledger.visits);
  const remaining = Math.max(ledger.insurance.deductible - paid, 0);

  return (
    <LedgerContext.Provider
      value={{
        ledger,
        amountPaidSoFar: paid,
        deductibleRemaining: remaining,
        addVisit,
        resetLedger,
        updateProfile,
        selectedProcedureId,
        setSelectedProcedureId,
        selectedProviderIds,
        setSelectedProviderIds,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider");
  return ctx;
}
