import { NextRequest, NextResponse } from "next/server";
import { callGrok } from "@/lib/grokClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { providers, deductibleRemaining } = body;

  const systemPrompt =
    "You are a friendly healthcare cost assistant. You are given a list of providers with " +
    "their sticker price, the patient's actual out-of-pocket cost (already calculated), wait " +
    "times, and any billing pattern flags. Write a short (2-3 sentence) plain-English summary " +
    "that helps the patient understand which option is best for THEM and why, considering " +
    "their personalized cost, wait time, and any billing flags. Do not invent numbers — only " +
    "use the numbers given. Be concise and direct.";

  const userPrompt = `Patient's remaining deductible: $${deductibleRemaining}.\n\nProvider options:\n${JSON.stringify(
    providers,
    null,
    2
  )}`;

  const result = await callGrok(systemPrompt, userPrompt, 200);
  return NextResponse.json({ narration: result });
}
