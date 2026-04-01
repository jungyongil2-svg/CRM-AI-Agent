import { retrieveDocsForCustomer } from "@/lib/contentRag";
import type { Customer } from "@/types";

function shorten(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}

function extractSmsCustomization(c: Customer): string {
  // "타겟 현재 상황"을 문장에 자연스럽게 박기 위한 대표 포인트(데모용).
  const point =
    c.featureSummary ||
    c.transactionFeatures?.[0] ||
    c.careTaskFeatures?.[0] ||
    "고객님께 도움이 되는 혜택";
  // SMS에 너무 길면 보기 안좋아서 짧게 정리합니다.
  return shorten(point, 26);
}

function renderTemplate(template: string, c: Customer): string {
  const point = extractSmsCustomization(c);
  return template
    .split("{{과제}}")
    .join(c.targetTaskName)
    .split("{{맞춤포인트}}")
    .join(point)
    .split("{{요약}}")
    .join(c.featureSummary || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface SmsRecommendation {
  message: string;
  title?: string;
  why: string[];
  updatedAt: string;
}

/**
 * 승인 시점에 "타겟(현재 상황)"을 기반으로 RAG 추천 문자를 생성합니다.
 * 크로마/벡터DB 없이도 더미 코퍼스에서 검색→템플릿 치환으로 동작합니다.
 */
export function buildSmsRecommendationForCustomer(
  c: Customer
): SmsRecommendation | null {
  if (!c.recommendedContent.sms) return null;

  const hits = retrieveDocsForCustomer(c, "sms_template", 3, "target");
  const top = hits[0];

  const templateBody = top?.doc.body;
  if (!templateBody) return null;

  return {
    message: renderTemplate(templateBody, c),
    title: top?.doc.title,
    why: top?.why ?? [],
    updatedAt: "2025-03-25 09:15",
  };
}

