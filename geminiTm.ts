import type { Customer } from "../types";

declare const process: any;

function ensureBoldHints(script: string): string {
  if (/\*\*[^*]+\*\*/.test(script)) return script;
  const keywords = [
    "상담",
    "예약",
    "점검",
    "안내",
    "확인",
    "제안",
    "다음 행동",
    "문자",
    "통화",
    "리스크",
    "혜택",
    "맞춤",
    "상품",
  ];
  const paragraphs = script.split(/\n\s*\n/g);
  const next = paragraphs.map((p) => {
    let out = p;
    for (const kw of keywords) {
      const rx = new RegExp(`(${kw})`);
      if (rx.test(out)) {
        out = out.replace(rx, "**$1**");
        break;
      }
    }
    return out;
  });
  return next.join("\n\n");
}

function buildPrompt(input: {
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
    `너는 은행 영업점 TM 상담 대본 생성기다.`,
    `아래 [고객 정보]와 [참고 콘텐츠]를 바탕으로, 고객에게 바로 말할 수 있는 TM 스크립트를 생성하라.`,
    ``,
    `[고객 정보]`,
    `- 고객명: ${c.customerName}`,
    `- 지점: ${c.branchName}`,
    `- 과제: ${c.targetTaskName}`,
    `- 예상 적합 채널: ${c.primaryChannel}`,
    `- 요약: ${c.featureSummary}`,
    `- 핵심 신호(마이케어): ${c.careTaskFeatures.slice(0, 3).join(", ")}`,
    `- 핵심 신호(거래/행동): ${c.transactionFeatures.slice(0, 3).join(", ")}`,
    ``,
    `[참고 콘텐츠]`,
    snippets || "(참고 콘텐츠 없음)",
    ``,
    `- 출력 규칙: 반드시 한국어로 작성.`,
    `- 절대 개요형/목차형/번호형(예: 1), 2., -, •)으로 쓰지 말 것.`,
    `- 실제 통화 멘트처럼 자연스러운 말하기체로 작성할 것. (고객에게 바로 읽어도 어색하지 않게)`,
    `- 총 4~6개 단락으로 작성하고, 단락 사이에는 빈 줄 1개를 넣을 것.`,
    `- 각 단락은 2~4문장으로 작성할 것.`,
    `- 각 단락에서 핵심 키워드/행동 문구 1~2개는 **굵게** 표시할 것. (형식: **키워드**)`,
    `- 전체 대본에서 **볼드 표기(** **)**가 최소 4회 이상 포함되게 작성할 것.`,
    `- 반드시 포함할 내용: 오프닝, 맥락 설명, 니즈 확인 질문 1개 이상, 제안 방향(선택지 2개 가능), 준법/설명 체크 문구, 다음 행동(예약/문자 등), 클로징.`,
    `- 과도한 보장/확정 표현 금지. 준법은 일반적인 설명 의무/유의사항만 담아라.`,
    `- 제목/머리말/라벨(예: [오프닝], (1단계))은 쓰지 말고, 대본 본문만 출력할 것.`,
  ].join("\n");
}

export async function generateTmScriptGeminiServer(input: {
  customer: Customer;
  retrievedSnippets: { title: string; body: string }[];
}): Promise<{ script: string; provider: "gemini"; model: string }> {
  const apiKey = process?.env?.Gemini_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Gemini_API_KEY가 없습니다.");

  const model = "gemini-3.1-flash-lite-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = buildPrompt(input);

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        topP: 0.9,
        maxOutputTokens: 700,
      },
    }),
  });

  if (!resp.ok) throw new Error(`Gemini TM 생성 실패 (HTTP ${resp.status})`);

  const json = (await resp.json()) as any;
  const text: string | undefined =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  const script = ensureBoldHints(typeof text === "string" ? text : "");
  if (script.trim().length === 0) throw new Error("Gemini TM 생성 실패 (빈 응답)");

  // 번호형 개요 스크립트 방지 + 단락 구조 최소 보장
  const numberedLike = /(^|\n)\s*(?:\d+[\).]|[-•])\s+/m.test(script);
  if (numberedLike) {
    throw new Error("Gemini TM 생성 실패 (번호형/개요형 응답)");
  }
  const paragraphs = script
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length < 3) {
    throw new Error("Gemini TM 생성 실패 (단락 수 부족)");
  }

  return { script, provider: "gemini", model };
}

