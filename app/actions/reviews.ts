"use server";

import { db } from "@/lib/db";
import { hospitalReviews, type HospitalReview } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export interface ReviewSummary {
  reviews: HospitalReview[];
  count: number;
  average: number;
}

export async function getReviews(hospitalId: string): Promise<ReviewSummary> {
  if (!hospitalId) return { reviews: [], count: 0, average: 0 };

  const reviews = await db
    .select()
    .from(hospitalReviews)
    .where(eq(hospitalReviews.hospitalId, hospitalId))
    .orderBy(desc(hospitalReviews.createdAt));

  const count = reviews.length;
  const average =
    count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  return { reviews, count, average };
}

export async function addReview(input: {
  hospitalId: string;
  hospitalName: string;
  rating: number;
  comment: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const hospitalId = input.hospitalId?.trim();
  const hospitalName = input.hospitalName?.trim();
  const rating = Math.round(Number(input.rating));
  const comment = input.comment?.trim() ?? "";

  if (!hospitalId || !hospitalName) {
    return { ok: false, error: "Missing hospital information." };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Please select a rating between 1 and 5 stars." };
  }
  if (comment.length > 1000) {
    return { ok: false, error: "Comment must be 1000 characters or fewer." };
  }

  await db.insert(hospitalReviews).values({
    hospitalId,
    hospitalName,
    rating,
    comment: comment.length > 0 ? comment : null,
  });

  return { ok: true };
}
