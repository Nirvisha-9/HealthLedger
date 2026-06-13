const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

export async function callGrok(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 300
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return "(Grok narration unavailable — no XAI_API_KEY set. Add it to .env.local)";
  }

  try {
    const res = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("xAI API error:", res.status, errText);
      return "(Unable to generate AI explanation right now.)";
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    console.error("xAI fetch failed:", err);
    return "(Unable to generate AI explanation right now.)";
  }
}
