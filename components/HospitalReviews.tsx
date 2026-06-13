"use client";

import { useEffect, useState, useTransition } from "react";
import { addReview, getReviews, type ReviewSummary } from "@/app/actions/reviews";
import type { HospitalReview } from "@/lib/db/schema";

interface Props {
  hospitalId: string;
  hospitalName: string;
}

function Stars({
  value,
  onChange,
  size = 16,
  interactive = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          role={interactive ? "button" : undefined}
          aria-label={interactive ? `Rate ${n} star${n > 1 ? "s" : ""}` : undefined}
          onClick={interactive ? () => onChange?.(n) : undefined}
          onMouseEnter={interactive ? () => setHover(n) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          style={{
            fontSize: size,
            lineHeight: 1,
            cursor: interactive ? "pointer" : "default",
            color: n <= shown ? "#f59e0b" : "#d1d5db",
            transition: "color 0.1s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} mo ago`;
  return `${Math.floor(diff / (365 * day))} yr ago`;
}

export default function HospitalReviews({ hospitalId, hospitalName }: Props) {
  const [data, setData] = useState<ReviewSummary | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    setData(null);
    getReviews(hospitalId).then((res) => {
      if (active) setData(res);
    });
    return () => {
      active = false;
    };
  }, [hospitalId]);

  const handleSubmit = () => {
    setError("");
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    startTransition(async () => {
      const res = await addReview({ hospitalId, hospitalName, rating, comment });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRating(0);
      setComment("");
      setJustSubmitted(true);
      const refreshed = await getReviews(hospitalId);
      setData(refreshed);
    });
  };

  const reviews: HospitalReview[] = data?.reviews ?? [];

  return (
    <div style={{ padding: "14px 18px 4px", borderTop: "8px solid #f3f4f6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Patient reviews
        </p>
        {data && data.count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Stars value={Math.round(data.average)} size={14} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
              {data.average.toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              ({data.count})
            </span>
          </div>
        )}
      </div>

      {/* ── Submit form ── */}
      <div style={{
        background: "#f9fafb", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: "12px 14px", marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Share your experience
          </span>
          <Stars value={rating} onChange={setRating} interactive size={22} />
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the billing, wait time, and staff? Your review is anonymous."
          maxLength={1000}
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "8px 10px", fontSize: 13, fontFamily: "inherit",
            color: "#111827", resize: "vertical", outline: "none",
            background: "#fff",
          }}
        />
        {error && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#be123c" }}>{error}</p>
        )}
        {justSubmitted && !error && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#15803d", fontWeight: 600 }}>
            ✓ Thanks! Your anonymous review was posted.
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            style={{
              padding: "8px 18px", borderRadius: 9, border: "none",
              background: isPending ? "#86efac" : "#16a34a",
              color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: isPending ? "default" : "pointer",
            }}
          >
            {isPending ? "Posting…" : "Post review"}
          </button>
        </div>
      </div>

      {/* ── Reviews list ── */}
      {data === null ? (
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
          Loading reviews…
        </p>
      ) : reviews.length === 0 ? (
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #f3f4f6", borderRadius: 10,
                padding: "10px 12px", background: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: r.comment ? 6 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Stars value={r.rating} size={13} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                    Anonymous
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {timeAgo(r.createdAt as unknown as Date)}
                </span>
              </div>
              {r.comment && (
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
