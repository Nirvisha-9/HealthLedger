"use client";

import { useEffect, useState } from "react";

interface NarrationBoxProps {
  providers: {
    name: string;
    stickerPrice: number;
    yourCost: number;
    waitDays: number;
    reviewFlag: string;
  }[];
  deductibleRemaining: number;
}

export default function NarrationBox({ providers, deductibleRemaining }: NarrationBoxProps) {
  const [narration, setNarration] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (providers.length === 0) return;
    let active = true;
    setLoading(true);
    fetch("/api/narrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providers, deductibleRemaining }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (active) setNarration(data.narration || "");
      })
      .catch(() => {
        if (active) setNarration("");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(providers), deductibleRemaining]);

  if (providers.length === 0) return null;

  return (
    <div
      className="card p-4 flex gap-3 items-start"
      style={{ background: "#eef9f9", borderColor: "#cfe9e9" }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
        style={{ background: "var(--color-primary)" }}
      >
        AI
      </div>
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
          Grok's take
        </p>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Thinking through your options…
          </p>
        ) : (
          <p className="text-sm">{narration}</p>
        )}
      </div>
    </div>
  );
}
