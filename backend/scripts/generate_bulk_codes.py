#!/usr/bin/env python3
"""
Generate bulk access codes for a school.
Run: python -m scripts.generate_bulk_codes --school-id <uuid> --count <number>
"""

import argparse
import asyncio
import csv
import uuid

from app.db.database import db_session
from app.db.models import AccessCode


async def generate(school_id: str, count: int):
    async with db_session() as session:
        codes = []
        for _ in range(count):
            code = f"DA-{uuid.uuid4().hex[:8].upper()}"
            codes.append(AccessCode(
                id=str(uuid.uuid4()),
                code=code,
                type="org",
                status="pending",
                school_id=school_id
            ))
        session.add_all(codes)
        await session.commit()
        print(f"✅ Generated {count} codes for school {school_id}")
        # Export to CSV
        with open("access_codes.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["code", "status", "school_id"])
            for c in codes:
                writer.writerow([c.code, c.status, c.school_id])
        print("📄 Exported to access_codes.csv")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--school-id", required=True, help="UUID of the school")
    parser.add_argument("--count", type=int, required=True, help="Number of codes to generate")
    args = parser.parse_args()
    asyncio.run(generate(args.school_id, args.count))