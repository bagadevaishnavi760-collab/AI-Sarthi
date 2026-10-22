from __future__ import annotations

import argparse
import sys

from api.rag_service import ModelUnavailable, RAGService


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Load and validate the local Sentence Transformers embedding model."
    )
    parser.add_argument(
        "--download",
        action="store_true",
        help="Allow downloading missing model files from the configured Hugging Face endpoint.",
    )
    args = parser.parse_args()
    service = RAGService()
    try:
        embeddings = service.initialize_embedding_model(download=args.download)
        dimension = len(embeddings.embed_query("AI Sarthi embedding setup verification."))
    except ModelUnavailable as exc:
        print(f"Embedding model setup failed: {exc}", file=sys.stderr)
        return 1
    print(f"Embedding model ready: {service.embedding_model} ({dimension} dimensions)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
