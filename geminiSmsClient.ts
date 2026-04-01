import type { Customer } from "@/types";

export async function generateSmsGeminiAsync(input: {
  customer: Customer;
  retrievedSnippets: { title: string; body: string }[];
}): Promise<string> {
  const resp = await fetch("/api/gemini/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!resp.ok) throw new Error(`Gemini SMS 생성 실패 (HTTP ${resp.status})`);
  const data = (await resp.json()) as { message?: string };
  if (typeof data.message !== "string" || data.message.trim().length === 0) {
    throw new Error("Gemini SMS 생성 실패 (빈 응답)");
  }
  return data.message;
}

