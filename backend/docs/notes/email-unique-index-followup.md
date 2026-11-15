# Follow-up: Partial unique index on `users.email`

## Status

Deferred — not in PR2. Implement in its own migration PR after PR2 is merged and stable.

## Why

`users.email` is currently nullable (org students have no email) and has only a plain
non-unique index. The application already performs a case-insensitive collision check
in `accept_super_admin_invite` and `seed_super_admin`, but that check is not atomic:
two concurrent requests could both pass the check and then race to insert the same
normalised email, resulting in silent duplicate rows. The `users.username` unique
constraint is the last-resort guard today, but it only works because we set
`username = lower(email)` for super admins.

## Migration (separate PR)

Create the index concurrently so the table is not locked:

```sql
CREATE UNIQUE INDEX CONCURRENTLY uq_users_email_lower
    ON users (LOWER(email))
    WHERE email IS NOT NULL;
```

In Alembic, use two operations — `CREATE INDEX CONCURRENTLY` cannot run inside a
transaction, so the migration must opt out of wrapping DDL in a transaction:

```python
# migration file header
def upgrade() -> None:
    op.execute(
        "CREATE UNIQUE INDEX CONCURRENTLY uq_users_email_lower "
        "ON users (LOWER(email)) WHERE email IS NOT NULL"
    )

def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_users_email_lower")
```

Also set `transaction_per_migration = False` in `env.py` (or scope to this migration
only via `migration_context`), because `CREATE INDEX CONCURRENTLY` is not allowed
inside a transaction block.

## Changes required in `register()`

After the index is in place, `register()` in `auth_service.py` can still race through
the application-level duplicate check. Catch `IntegrityError` on `session.commit()`
and return the same response as the existing "already registered" path:

```python
from sqlalchemy.exc import IntegrityError

try:
    await session.commit()
except IntegrityError as err:
    await session.rollback()
    raise UserAlreadyRegisteredError() from err
```

Apply the same catch to any other insert path that may supply a non-null email
(org-login registration, etc.).

## Verification before deploying to production

Run the query below and confirm the count is **0** before creating the index.
A non-zero result means duplicate normalised emails already exist and must be
resolved (by merging or deleting the duplicates) before the index can be created.

```sql
SELECT COUNT(*) FROM (
    SELECT LOWER(email), COUNT(*) AS cnt
    FROM users
    WHERE email IS NOT NULL
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
) dups;
```
