#!/usr/bin/env python3
"""
Generate bulk free individual access codes for beta testers.

Usage:
    python -m scripts.generate_beta_codes --count 20 [--prefix BETA] [--duration 4] [--output beta_codes.csv]
"""

import argparse
import asyncio
import csv
import uuid
from datetime import UTC, datetime, timedelta

from app.db.database import db_session
from app.db.models import AccessCode


async def generate_beta_codes(
    count: int = 20,
    prefix: str = "BETA",
    duration_months: int = 4,
    output_file: str = "beta_access_codes.csv",
):
    now = datetime.now(UTC)
    expires_at = now + timedelta(days=duration_months * 30)

    async with db_session() as session:
        codes: list[AccessCode] = []
        for _ in range(count):
            random_hex = uuid.uuid4().hex[:8].upper()
            code_str = f"{prefix.strip().upper()}-{random_hex}"
            codes.append(
                AccessCode(
                    id=str(uuid.uuid4()),
                    code=code_str,
                    type="individual",
                    status="pending",
                    created_at=now,
                    expires_at=expires_at,
                )
            )

        session.add_all(codes)
        await session.commit()
        print(
            f"✅ Generated {count} individual beta access codes (valid for {duration_months} months)."
        )

        with open(output_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["code", "type", "status", "expires_at"])
            for c in codes:
                writer.writerow(
                    [
                        c.code,
                        c.type,
                        c.status,
                        c.expires_at.isoformat() if c.expires_at else "",
                    ]
                )

        print(f"📄 Exported {count} codes to {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate individual beta access codes."
    )
    parser.add_argument(
        "--count", type=int, default=20, help="Number of codes to generate"
    )
    parser.add_argument(
        "--prefix", default="BETA", help="Prefix for codes (default: BETA)"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=4,
        help="Access duration in months (default: 4)",
    )
    parser.add_argument(
        "--output",
        default="beta_access_codes.csv",
        help="CSV filename for export (default: beta_access_codes.csv)",
    )

    args = parser.parse_args()
    asyncio.run(
        generate_beta_codes(
            count=args.count,
            prefix=args.prefix,
            duration_months=args.duration,
            output_file=args.output,
        )
    )


if __name__ == "__main__":
    main()
