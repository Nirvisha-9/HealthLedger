import { NextRequest, NextResponse } from "next/server";
import { callGrok } from "@/lib/grokClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { providerName, procedureName, cptCode, yourCost, stickerPrice, address } = body;

  const systemPrompt =
    "You write short, polite, professional messages patients can send to a healthcare " +
    "provider's billing office. Reference the No Surprises Act and Good Faith Estimate " +
    "rights where relevant. Keep it under 120 words. Output only the message text, no " +
    "preamble or signature block beyond 'Thank you'.";

  const userPrompt =
    `Write a cost-confirmation / Good Faith Estimate request message for a patient ` +
    `scheduling the following:\n` +
    `- Provider: ${providerName} (${address})\n` +
    `- Procedure: ${procedureName} (CPT code ${cptCode})\n` +
    `- Sticker price quoted: $${stickerPrice}\n` +
    `- Patient's estimated out-of-pocket based on their insurance: $${yourCost}\n\n` +
    `The message should ask the billing office to confirm in writing that the patient's ` +
    `out-of-pocket cost will be $${yourCost} before the appointment, and to disclose any ` +
    `additional fees (facility, anesthesia, professional reads) that might apply.`;

  const result = await callGrok(systemPrompt, userPrompt, 250);
  return NextResponse.json({ letter: result });
}
