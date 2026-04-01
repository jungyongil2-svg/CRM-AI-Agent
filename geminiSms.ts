import type { Customer } from "../types";

declare const process: any;

function buildSmsPrompt(input: {
  customer: Customer;
  retrievedSnippets: { title: string; body: string }[];
}): string {
  const c = input.customer;
  const snippets = input.retrievedSnippets
    .slice(0, 4)
    .map((s, idx) => {
      const body = s.body.length > 900 ? s.body.slice(0, 900) + "…" : s.body;
      return `# 참고 ${idx + 1}\n[제목] ${s.title}\n[내용]\n${body}`;
    })
    .join("\n\n");

  return [
    `너는 은행의 고객관리 과제 수행을 위한 "문자 메시지"를 작성하는 모델이다.`,
    `아래 [고객 정보]와 [과제 맥락], [참고 템플릿]을 바탕으로 실제 발송 가능한 문자를 작성하라.`,
    ``,
    `[고객 정보]`,
    `- 고객명: ${c.customerName}`,
    `- 지점: ${c.branchName}`,
    `- 세그먼트: ${c.segment}`,
    `- 과제: ${c.targetTaskName}`,
    `- 타겟 요약: ${c.featureSummary}`,
    `- 핵심 신호(마이케어): ${c.careTaskFeatures.slice(0, 3).join(", ")}`,
    `- 핵심 신호(거래/행동): ${c.transactionFeatures.slice(0, 3).join(", ")}`,
    ``,
    `[참고 템플릿/우수사례(RAG)]`,
    snippets || "(참고 없음)",
    ``,
    `[출력 규칙]`,
    `- 반드시 한국어.`,
    `- 최소 5줄 이상. (줄바꿈 포함하여 5줄+)`,
    `- 첫 줄은 발신(은행명) 표기: [우리은행] 형태로 시작.`,
    `- 과도한 보장/확정 표현 금지. 투자/수익 보장 금지.`,
    `- 마지막 줄에는 회신/연락 유도 1개를 포함.`,
    `- 불필요한 설명(메타 설명) 금지. 결과는 "문자 본문"만 출력.`,
  ].join("\n");
}

export async function generateSmsGeminiServer(input: {
  customer: Customer;
  retrievedSnippets: { title: string; body: string }[];
}): Promise<string> {
  const apiKey = process?.env?.Gemini_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Gemini_API_KEY가 없습니다.");

  const model = "gemini-3.1-flash-lite-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = buildSmsPrompt(input);
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        topP: 0.9,
        maxOutputTokens: 600,
      },
    }),
  });

  if (!resp.ok) throw new Error(`Gemini SMS 생성 실패 (HTTP ${resp.status})`);
  const json = (await resp.json()) as any;
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  const message = typeof text === "string" ? text.trim() : "";
  if (!message) throw new Error("Gemini SMS 생성 실패 (빈 응답)");

  const lines = message.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 5) throw new Error("Gemini SMS 생성 실패 (5줄 미만)");

  return message;
}

