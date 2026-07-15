#!/usr/bin/env python3
"""
Generate and print a daily AI cost report for the PM.
Run: python scripts/cost_report.py
"""

import asyncio
from datetime import datetime

from app.services.cost_tracking import get_cost_report


async def main():
    report = await get_cost_report()
    total_tokens = sum(r['tokens_today'] for r in report)
    total_cost = sum(r['estimated_cost_usd'] for r in report)
    active_students = len(report)
    total_messages = sum(r['messages_today'] for r in report)

    print(f"=== DefinAm AI Cost Report --- {datetime.now().strftime('%Y-%m-%d')} ===")
    print(f"Active students today: {active_students}")
    print(f"Total messages sent: {total_messages}")
    print(f"Total tokens used: {total_tokens}")
    print(f"Estimated cost (USD): ${total_cost:.4f}")
    print(f"Cost per active student: ${(total_cost/active_students) if active_students else 0:.6f}")
    print("=========================================")

    if active_students == 0:
        print("No chat activity today.")

if __name__ == "__main__":
    asyncio.run(main())