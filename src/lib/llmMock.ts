import type { Customer } from "@/types";

function safeFirst(list: string[] | undefined): string {
  return list && list.length ? list[0] : "";
}

function pickN<T>(arr: T[], n: number): T[] {
  return arr.slice(0, Math.max(0, n));
}

/**
 * 데모용 LLM 생성기.
 * - 입력(고객/과제/참고 스니펫)에 따라 문구를 구성
 * - 5줄 이상(대개 7~9줄)로 생성
 */
export function generateTmScriptMock(input: {
  customer: Customer;
  retrievedSnippets: { title: string; body: string }[];
}): string {
  const { customer: c, retrievedSnippets } = input;

  const cue1 = safeFirst(c.careTaskFeatures);
  const cue2 = safeFirst(c.transactionFeatures);
  const snippetTitles = pickN(retrievedSnippets.map((s) => s.title), 2);

  const opening =
    `안녕하세요 ${c.customerName} 고객님, ${c.branchName} 담당자입니다. ` +
    `오늘은 '${c.targetTaskName}' 관련으로 잠시 확인드려도 괜찮으실까요?`;

  const context =
    cue1 || cue2
      ? `최근 신호로는 ${[cue1, cue2].filter(Boolean).join(" / ")} 부분이 보여서요.`
      : "최근 이용 패턴을 보면 지금 점검해 두면 좋은 포인트가 있어 연락드렸습니다.";

  const needProbe =
    "먼저 간단히 여쭤볼게요. 이번 자금은 (1) 단기 운영 (2) 중장기 목돈 (3) 변동성 최소화 중 어떤 쪽이 더 우선이실까요?";

  const option1 =
    "가능한 방향이 두 가지입니다. 하나는 '안정형 재예치'로 조건·만기 관리를 간단히 하고, 다른 하나는 '분산형'으로 예금+저위험 대안을 함께 비교해 보는 방법입니다.";

  const risk =
    "안내드리기 전에 적합성/설명 의무 체크만 짧게 진행하겠습니다. 불편하시면 바로 중단하고 요약만 문자로 드릴게요.";

  const nextAction =
    c.primaryChannel === "영업점TM"
      ? "지금 3분만 투자해서 핵심만 비교해드릴까요? 원하시면 오늘/내일 중 편하신 시간으로 짧게 예약도 가능합니다."
      : "원하시면 요약을 문자로 보내드리고, 확인 후 편하실 때 답주셔도 됩니다.";

  const close =
    "정리하면, 고객님 상황에 맞춰 '우선순위 1개'를 먼저 정하고 그에 맞는 선택지 2개만 간단히 비교드리는 방식으로 진행하겠습니다.";

  const ref =
    snippetTitles.length > 0
      ? `참고한 기존 우수사례/템플릿: ${snippetTitles.join(" · ")}`
      : "참고한 기존 우수사례/템플릿을 기반으로 대화 흐름을 구성했습니다.";

  return [
    `1) 오프닝: ${opening}`,
    `2) 맥락: ${context}`,
    `3) 니즈 확인 질문: ${needProbe}`,
    `4) 제안 방향: ${option1}`,
    `5) 확인/준법: ${risk}`,
    `6) 다음 행동: ${nextAction}`,
    `7) 클로징: ${close}`,
    `8) 참고: ${ref}`,
  ].join("\n");
}

export async function generateTmScriptMockAsync(input: {
  customer: Customer;
  retrievedSnippets: { title: string; body: string }[];
}): Promise<string> {
  // 네트워크/API 호출 느낌만 주는 지연(데모)
  await new Promise((r) => window.setTimeout(r, 650));
  return generateTmScriptMock(input);
}

