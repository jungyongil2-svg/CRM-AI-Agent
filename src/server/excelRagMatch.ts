import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Customer, RagApiMeta } from "../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PROJECT_ROOT = resolve(__dirname, "../..");
const CORPUS_JSON = resolve(PROJECT_ROOT, "src/data/rag_sms_corpus.json");

export type SmsRagMatchResponse = {
  customers: Customer[];
  rag: RagApiMeta;
};

type CorpusFile = {
  version?: number;
  items?: RagSmsItem[];
};

export type RagSmsItem = {
  id: string;
  text: string;
  campaign_id: string;
  campaign_name: string;
  template_title: string;
};

function cloneCustomerList(customers: Customer[]): Customer[] {
  return JSON.parse(JSON.stringify(customers)) as Customer[];
}

function buildSmsQuery(c: Customer): string {
  return [
    c.targetTaskName,
    c.featureSummary,
    ...(c.careTaskFeatures ?? []),
    ...(c.transactionFeatures ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function tokenize(s: string): Set<string> {
  const lower = s.toLowerCase();
  const bySpace = lower.split(/[\s\n\r\t]+|[.,!?;:()[\]{}'"`·…]+/u).filter((x) => x.length > 1);
  const kr = lower.match(/[\u3131-\uD79D]{2,}/g) ?? [];
  return new Set([...bySpace, ...kr]);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** 엑셀 코퍼스 문서와 쿼리 유사도 (한글·공백 혼합 대비) */
function scoreQueryDoc(query: string, docText: string): number {
  const qSet = tokenize(query);
  const tSet = tokenize(docText);
  const j = jaccard(qSet, tSet);
  const qArr = [...qSet];
  let sub = 0;
  for (const w of qArr) {
    if (w.length >= 2 && docText.toLowerCase().includes(w)) sub += 1;
  }
  const subRatio = qArr.length ? sub / qArr.length : 0;
  return j * 0.55 + subRatio * 0.45;
}

function bestItem(query: string, items: RagSmsItem[]): RagSmsItem | null {
  const q = query.trim();
  if (!q) return items[0] ?? null;
  let best: RagSmsItem | null = null;
  let bestScore = -1;
  for (const it of items) {
    const s = scoreQueryDoc(q, it.text);
    if (s > bestScore) {
      bestScore = s;
      best = it;
    }
  }
  return best;
}

function loadCorpus(): RagSmsItem[] {
  if (!existsSync(CORPUS_JSON)) return [];
  const raw = readFileSync(CORPUS_JSON, "utf-8");
  const parsed = JSON.parse(raw) as CorpusFile;
  return Array.isArray(parsed.items) ? parsed.items : [];
}

/**
 * 엑셀에서 생성한 `rag_sms_corpus.json`을 기반으로 문자 템플릿을 매칭합니다.
 * (Python 3.14 + chromadb 호환 문제를 피하기 위해 런타임은 Node만 사용)
 */
export function matchCustomersWithSmsRag(customers: Customer[]): SmsRagMatchResponse {
  const next = cloneCustomerList(customers);
  const smsCandidates = next.filter(
    (c) => c.recommendedContent?.sms?.templateOrNew === "기존템플릿"
  );
  const totalSmsCandidates = smsCandidates.length;

  const items = loadCorpus();
  if (items.length === 0) {
    return {
      customers: next,
      rag: {
        ok: false,
        matchedSmsCount: 0,
        totalSmsCandidates,
        error: `SMS 코퍼스 파일이 없습니다: ${CORPUS_JSON}`,
        hint: "프로젝트 루트에서 npm run rag:build 를 실행해 엑셀에서 rag_sms_corpus.json 을 생성하세요.",
      },
    };
  }

  let matchedSmsCount = 0;
  for (const c of next) {
    if (c.recommendedContent?.sms?.templateOrNew !== "기존템플릿") continue;
    const q = buildSmsQuery(c);
    const hit = bestItem(q, items);
    if (hit && hit.text.trim()) {
      matchedSmsCount += 1;
      c.recommendedContent.sms!.message = hit.text;
      c.recommendedContent.sms!.templateId = hit.campaign_id || hit.id;
      const title = hit.template_title?.trim();
      c.recommendedContent.sms!.reason = title
        ? `엑셀 RAG 매칭 · ${title}`
        : "엑셀 RAG 매칭 (시드 템플릿)";
      c.recommendedContent.sms!.ragSource = "excel";
    } else {
      c.recommendedContent.sms!.ragSource = "demo";
    }
  }

  return {
    customers: next,
    rag: {
      ok: true,
      matchedSmsCount,
      totalSmsCandidates,
    },
  };
}

/** @deprecated 이름 호환 */
export const matchCustomersWithChroma = matchCustomersWithSmsRag;
