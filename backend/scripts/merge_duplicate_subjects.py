"""One-off script to merge duplicate 'English' subject into canonical 'English Language'."""

from __future__ import annotations

import asyncio

from sqlalchemy import delete as sa_delete
from sqlalchemy import select, update

from app.db.database import db_session
from app.db.models import Subject, SyllabusChunk


async def merge_english_subject() -> None:
    source_name = "English"
    target_name = "English Language"

    async with db_session() as session:
        # Check source rows
        source_res = await session.execute(
            select(Subject).where(Subject.name == source_name)
        )
        source_rows = source_res.scalars().all()

        if not source_rows:
            print(f"No subject rows found for '{source_name}'. Database clean.")
            return

        target_res = await session.execute(
            select(Subject.class_level).where(Subject.name == target_name)
        )
        existing_target_levels = {r[0] for r in target_res.fetchall()}

        renamed = 0
        dropped = 0

        for subj in source_rows:
            if subj.class_level in existing_target_levels:
                await session.execute(
                    sa_delete(Subject).where(Subject.id == subj.id)
                )
                dropped += 1
            else:
                subj.name = target_name
                renamed += 1

        # Handle SyllabusChunk
        target_chunks_exist = (
            await session.execute(
                select(SyllabusChunk.id)
                .where(SyllabusChunk.subject_name == target_name)
                .limit(1)
            )
        ).scalar_one_or_none() is not None

        if target_chunks_exist:
            await session.execute(
                sa_delete(SyllabusChunk).where(
                    SyllabusChunk.subject_name == source_name
                )
            )
        else:
            await session.execute(
                update(SyllabusChunk)
                .where(SyllabusChunk.subject_name == source_name)
                .values(subject_name=target_name)
            )

        await session.commit()

        print(
            f"Successfully merged '{source_name}' into '{target_name}'. "
            f"Renamed: {renamed}, Dropped: {dropped}."
        )


if __name__ == "__main__":
    asyncio.run(merge_english_subject())
