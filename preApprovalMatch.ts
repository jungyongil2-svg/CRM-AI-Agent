import type { Customer } from "@/types";
import { retrieveDocsForCustomer } from "@/lib/contentRag";

function splitTwoLines(body: string): { line1: string; line2: string } {
  const parts = body
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { line1: parts[0], line2: parts[1] };
  if (parts.length === 1) return { line1: parts[0], line2: "" };
  return { line1: "", line2: "" };
}

/**
 * 타겟 생성 직후(승인 전)에 "기존 템플릿 자동 매칭"이 끝나 있어야 합니다.
 * - 여기서는 더미 코퍼스 기반 RAG로 자동 매칭(데모)
 * - 실제 구현에서는 Chroma/벡터DB 검색 결과로 교체
 */
export function applyPreApprovalRagMatch(c: Customer): Customer {
  const next: Customer = (globalThis as any).structuredClone
    ? (globalThis as any).structuredClone(c)
    : (JSON.parse(JSON.stringify(c)) as Customer);

  // 문자: 기존템플릿이면 RAG로 템플릿을 매칭해서 message를 채움
  if (next.recommendedContent.sms?.templateOrNew === "기존템플릿") {
    const hit = retrieveDocsForCustomer(next, "sms_template", 1)[0];
    if (hit?.doc?.body) {
      next.recommendedContent.sms.message = hit.doc.body;
      next.recommendedContent.sms.templateId = hit.doc.id;
      next.recommendedContent.sms.reason = `RAG 매칭: ${hit.doc.title}`;
    }
  }

  // 푸쉬: 기존템플릿이면 RAG로 title/body를 매칭
  if (next.recommendedContent.push?.templateOrNew === "기존템플릿") {
    const hit = retrieveDocsForCustomer(next, "push_template", 1)[0];
    if (hit?.doc?.body) {
      const lines = hit.doc.body.split("\n").filter(Boolean);
      next.recommendedContent.push.title = hit.doc.title;
      next.recommendedContent.push.body = lines.join("\n");
    }
  }

  // 배너: RAG 카피를 line1/line2로 매칭
  if (next.recommendedContent.banner) {
    const hit = retrieveDocsForCustomer(next, "banner_copy", 1)[0];
    if (hit?.doc?.body) {
      const { line1, line2 } = splitTwoLines(hit.doc.body);
      if (line1) next.recommendedContent.banner.line1 = line1;
      if (line2) next.recommendedContent.banner.line2 = line2;
    }
  }

  return next;
}

