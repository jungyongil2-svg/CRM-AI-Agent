"""엑셀 Sheet1에서 SMS 템플릿 목록 파싱 (pandas만 사용, chromadb 불필요)."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

import pandas as pd


def parse_sheet1(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Sheet1 구조(관측):
    - row 1: 캠페인/캠페인ID(컬럼별)
    - row 2: 캠페인명(컬럼별)
    - row 3: 템플릿명(세트1)
    - row 4: 본문(세트1)
    ...
    """
    docs: List[Dict[str, Any]] = []

    col_indices = list(range(1, df.shape[1]))
    campaign_ids = {c: df.iloc[1, c] for c in col_indices}
    campaign_names = {c: df.iloc[2, c] for c in col_indices}

    pairs: List[Tuple[int, int]] = [(3, 4), (5, 6), (7, 8), (9, 10), (11, 12)]

    for c in col_indices:
        camp_id = str(campaign_ids.get(c) or "").strip()
        camp_name = str(campaign_names.get(c) or "").strip()
        if not camp_id and not camp_name:
            continue

        for ti, bi in pairs:
            if ti >= len(df) or bi >= len(df):
                continue
            template_title = df.iloc[ti, c]
            body = df.iloc[bi, c]
            if pd.isna(template_title) or pd.isna(body):
                continue
            template_title = str(template_title).strip()
            body = str(body).strip()
            if not template_title or not body:
                continue

            doc_id = f"{camp_id}::{ti}"
            docs.append(
                {
                    "id": doc_id,
                    "type": "sms_template",
                    "channel": "문자메시지",
                    "campaign_id": camp_id,
                    "campaign_name": camp_name,
                    "template_title": template_title,
                    "body": body,
                }
            )

    return docs


def document_for_embedding(d: Dict[str, Any]) -> str:
    """Chroma/Node RAG 공통 검색용 문서 문자열."""
    return f"[캠페인]{d['campaign_name']}\n[템플릿]{d['template_title']}\n\n{d['body']}"
