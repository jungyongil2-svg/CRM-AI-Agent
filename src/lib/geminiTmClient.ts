import type { Customer } from "@/types";

export async function generateTmScriptGeminiAsync(input: {
  customer: Customer;
  retrievedSnippets: { title: string; body: string }[];
}): Promise<{ script: string; provider: "gemini"; model: string }> {
  const resp = await fetch("/api/gemini/tm-script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const raw = await resp.text();
  const json = raw ? (JSON.parse(raw) as any) : {};
  if (!resp.ok) {
    const msg = typeof json?.error === "string" ? json.error : raw || `HTTP ${resp.status}`;
    throw new Error(`Gemini TM 생성 실패: ${msg}`);
  }
  const data = json as { script?: string; provider?: string; model?: string };
  if (data.provider !== "gemini" || typeof data.model !== "string") {
    throw new Error("Gemini TM 생성 실패 (provider 확인 불가)");
  }
  if (typeof data.script !== "string" || data.script.trim().length === 0) {
    throw new Error("Gemini TM 생성 실패 (빈 응답)");
  }
  return { script: data.script, provider: "gemini", model: data.model as string };
}

