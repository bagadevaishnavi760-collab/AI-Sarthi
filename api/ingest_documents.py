from __future__ import annotations

import argparse
import sys

from api.rag_service import RAGError, RAGService


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest local policy and healthcare documents into FAISS.")
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Build a fresh index generation even when source files are unchanged.",
    )
    args = parser.parse_args()
    try:
        result = RAGService().ingest(rebuild=args.rebuild)
    except RAGError as exc:
        print(f"Ingestion failed: {exc}", file=sys.stderr)
        return 1
    print(f"Python interpreter: {sys.executable}")
    print(result["message"])
    print(f"Documents: {result['documents']}; chunks: {result['chunks']}; status: {result['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
