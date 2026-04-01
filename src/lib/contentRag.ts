import { ragCorpus } from "@/data/ragCorpus";
import type { RagDocType } from "@/data/ragCorpus";
import { ragSearch } from "@/lib/rag";
import type { Customer } from "@/types";

function buildQuery(c: Customer, hint?: string): string {
  return [
    c.segment,
    c.targetTaskName,
    c.featureSummary,
    c.primaryChannel,
    ...(c.careTaskFeatures ?? []),
    ...(c.transactionFeatures ?? []),
    hint ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function retrieveDocsForCustomer(c: Customer, type: RagDocType, k = 3, hint?: string) {
  const query = buildQuery(c, hint);
  const docs = ragCorpus.filter((d) => d.type === type);
  return ragSearch(query, docs, { k });
}

