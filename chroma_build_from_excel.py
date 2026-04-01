import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from excel_sms_parse import document_for_embedding, parse_sheet1


def write_corpus_json(docs: List[Dict[str, Any]], out_path: str) -> None:
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    items: List[Dict[str, Any]] = []
    for d in docs:
        items.append(
            {
                "id": d["id"],
                "text": document_for_embedding(d),
                "campaign_id": d["campaign_id"],
                "campaign_name": d["campaign_name"],
                "template_title": d["template_title"],
            }
        )
    payload = {"version": 1, "source": "excel_sheet1", "items": items}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"OK. wrote {len(items)} items to {out_path}")


def try_chromadb_index(docs: List[Dict[str, Any]], persist_dir: str, collection_name: str) -> None:
    """선택: chromadb + sentence-transformers. Python 3.14+ 에서는 pydantic 충돌로 생략."""
    import sys

    if sys.version_info >= (3, 14):
        print(
            "INFO: Python 3.14+: Chroma index skipped. "
            "App RAG uses rag_sms_corpus.json only."
        )
        return

    try:
        import chromadb
        from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
    except Exception as e:
        print(f"WARN: ChromaDB 사용 불가 ({e}). JSON 코퍼스만 생성되었습니다.")
        return

    try:
        embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        client = chromadb.PersistentClient(path=persist_dir)
        col = client.get_or_create_collection(name=collection_name, embedding_function=embed_fn)

        ids = [d["id"] for d in docs]
        try:
            col.delete(ids=ids)
        except Exception:
            pass

        col.add(
            ids=ids,
            documents=[document_for_embedding(d) for d in docs],
            metadatas=[
                {
                    "type": d["type"],
                    "channel": d["channel"],
                    "campaign_id": d["campaign_id"],
                    "campaign_name": d["campaign_name"],
                    "template_title": d["template_title"],
                }
                for d in docs
            ],
        )
        print(f"OK. upserted {len(docs)} docs into {persist_dir} / {collection_name}")
    except Exception as e:
        print(f"WARN: Chroma 인덱스 생성 실패 ({e}). JSON corpus는 이미 저장되었습니다.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--excel", required=True, help="엑셀 파일 경로")
    ap.add_argument("--persist-dir", default="chroma_db")
    ap.add_argument("--collection", default="bank_templates")
    ap.add_argument(
        "--json-out",
        default=os.path.join("src", "data", "rag_sms_corpus.json"),
        help="Node 런타임 RAG용 JSON (항상 생성)",
    )
    ap.add_argument(
        "--skip-chroma",
        action="store_true",
        help="Chroma 인덱스만 건너뛰기 (pandas + JSON만)",
    )
    args = ap.parse_args()

    excel_path = args.excel
    if not os.path.exists(excel_path):
        raise SystemExit(f"Excel not found: {excel_path}")

    df = pd.read_excel(excel_path, sheet_name="Sheet1", header=None)
    docs = parse_sheet1(df)
    if not docs:
        raise SystemExit("No docs parsed from excel (Sheet1).")

    os.makedirs(args.persist_dir, exist_ok=True)
    write_corpus_json(docs, args.json_out)

    if not args.skip_chroma:
        try_chromadb_index(docs, args.persist_dir, args.collection)


if __name__ == "__main__":
    main()
