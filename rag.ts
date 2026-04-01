import type { RagDoc } from "@/data/ragCorpus";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  const t = normalize(s);
  if (!t) return [];
  return t.split(" ").filter((x) => x.length >= 2);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

export interface RagHit<TDoc> {
  doc: TDoc;
  score: number;
  why: string[];
}

/**
 * 데모용 RAG 검색(간단 토큰/태그 유사도).
 * 실제 구현에서는 임베딩 + 벡터 검색 + 재랭킹으로 대체합니다.
 */
export function ragSearch(
  query: string,
  docs: RagDoc[],
  opts?: { k?: number }
): RagHit<RagDoc>[] {
  const k = opts?.k ?? 3;
  const qTokens = new Set(tokenize(query));

  const scored = docs
    .map((d) => {
      const bodyTokens = new Set(tokenize(`${d.title}\n${d.body}`));
      const tagTokens = new Set(d.tags.map(normalize));

      const tokenScore = jaccard(qTokens, bodyTokens);
      const tagScore = jaccard(qTokens, tagTokens);
      const score = tokenScore * 0.7 + tagScore * 0.3;

      const why: string[] = [];
      for (const t of qTokens) {
        if (d.tags.some((x) => normalize(x) === t)) why.push(`#${t}`);
        if (why.length >= 6) break;
      }
      return { doc: d, score, why };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((x) => x.score > 0);

  return scored;
}

