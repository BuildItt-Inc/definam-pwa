#!/usr/bin/env python3
"""
Ingest official WAEC syllabus PDFs into the syllabus_chunks table for
RAG-grounded content generation.

Usage:
    1. Download each subject's syllabus PDF from Drive.
    2. Save it as backend/scripts/syllabus_pdfs/<Subject Name>.pdf
       (the filename, minus .pdf, becomes the subject_name stored in the
       database — it must match the `name` used for that Subject row,
       e.g. "Biology.pdf" -> subject_name="Biology")
    3. Run: python scripts/ingest_syllabus.py
       Or for a single subject: python scripts/ingest_syllabus.py --subject=Biology

Re-running for a subject replaces its existing chunks (safe to re-run after
re-uploading a corrected PDF).
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import re
from pathlib import Path

from sqlalchemy import delete

from app.db.database import db_session
from app.db.models import SyllabusChunk
from app.services.embeddings import embed_text

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

PDF_DIR = Path(__file__).parent / "syllabus_pdfs"

# Matches WAEC syllabus heading patterns seen across subjects, e.g.:
#   "1.0 INTRODUCTION TO CHEMISTRY"   "1\. Classification"   "A. Concept of Living"
_HEADING_PATTERN = re.compile(
    r"^(?:\d+\.\d*\s|\d+\\?\.\s|[A-Z]\.\s)[A-Z][A-Za-z0-9 ,/&()\'-]{3,80}$",
    re.MULTILINE,
)


def extract_pdf_text(pdf_path: Path) -> str:
    import pdfplumber

    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)
    return "\n".join(text_parts)


def chunk_syllabus_text(raw_text: str) -> list[tuple[str, str]]:
    """Split syllabus text into (heading, content) chunks at major heading
    boundaries. Falls back to fixed-size chunks if no headings are detected
    (e.g. a differently-formatted syllabus)."""
    matches = list(_HEADING_PATTERN.finditer(raw_text))
    if len(matches) < 3:
        # Heading detection didn't work well for this document — fall back
        # to naive fixed-size chunks so ingestion still produces something
        # usable rather than one giant unsearchable blob.
        size = 1500
        return [
            (f"Section {i + 1}", raw_text[i : i + size])
            for i in range(0, len(raw_text), size)
        ]

    chunks: list[tuple[str, str]] = []
    for i, match in enumerate(matches):
        heading = match.group().strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw_text)
        content = raw_text[start:end].strip()
        if content:
            chunks.append((heading, content))
    return chunks


async def ingest_subject(pdf_path: Path) -> None:
    subject_name = pdf_path.stem
    logger.info(f"Extracting text from {pdf_path.name}...")
    raw_text = extract_pdf_text(pdf_path)
    if not raw_text.strip():
        logger.warning(f"No extractable text in {pdf_path.name} — skipping.")
        return

    chunks = chunk_syllabus_text(raw_text)
    logger.info(f"Split {subject_name} into {len(chunks)} chunks. Embedding...")

    rows = []
    for heading, content in chunks:
        embedding = await embed_text(f"{subject_name}: {heading}\n{content[:500]}")
        rows.append(
            SyllabusChunk(
                subject_name=subject_name,
                heading=heading[:300],
                content=content,
                embedding=embedding,
            )
        )
        if embedding is None:
            logger.warning(
                f"No embedding for chunk '{heading[:50]}' — check GEMINI_API_KEY. "
                f"Chunk stored without embedding and won't be retrievable until re-ingested."
            )

    async with db_session() as session:
        await session.execute(
            delete(SyllabusChunk).where(SyllabusChunk.subject_name == subject_name)
        )
        session.add_all(rows)

    logger.info(f"[DONE] Ingested {len(rows)} chunks for {subject_name}.")


async def main(subject: str | None = None) -> None:
    if not PDF_DIR.exists():
        logger.error(
            f"No {PDF_DIR} directory found. Create it and add subject PDFs first."
        )
        return

    pdf_files = sorted(PDF_DIR.glob("*.pdf"))
    if subject:
        pdf_files = [p for p in pdf_files if p.stem.lower() == subject.lower()]
        if not pdf_files:
            logger.error(f"No PDF found for subject '{subject}' in {PDF_DIR}.")
            return

    if not pdf_files:
        logger.warning(f"No PDF files found in {PDF_DIR}.")
        return

    for pdf_path in pdf_files:
        await ingest_subject(pdf_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest WAEC syllabus PDFs for RAG.")
    parser.add_argument(
        "--subject", type=str, help="Only ingest a single subject by PDF filename stem."
    )
    args = parser.parse_args()
    asyncio.run(main(subject=args.subject))
