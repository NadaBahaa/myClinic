# Database backup strategy

Medical and billing data must be backed up regularly. This document describes the recommended approach for this Laravel/MySQL deployment.

## What to back up

| Asset | Location | Priority |
|-------|----------|----------|
| MySQL database | `DB_DATABASE` in `.env` | Critical |
| Uploaded files | `backend/storage/app/public/` (patient photos, attachments) | Critical |
| Environment secrets | `.env` (store encrypted off-server) | High |
| Application code | Git repository | Medium (reproducible from repo) |

## Recommended schedule

- **Production**: automated daily full dump + hourly binlog/incremental if available
- **Staging**: daily dump before releases
- **Retention**: keep 30 daily, 12 weekly, 12 monthly backups minimum

## Manual backup (MySQL)

From the project root:

```bash
./backend/scripts/backup-database.sh
```

Or directly:

```bash
mysqldump -u "$DB_USERNAME" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_DATABASE" \
  | gzip > "backups/beauty-clinic-$(date +%Y%m%d-%H%M%S).sql.gz"
```

Include public uploads:

```bash
tar -czf "backups/uploads-$(date +%Y%m%d).tar.gz" -C backend/storage/app public
```

## Restore procedure

1. Put application in maintenance mode: `php artisan down`
2. Restore database: `gunzip -c backup.sql.gz | mysql -u user -p database`
3. Restore uploads archive to `backend/storage/app/public`
4. Clear caches: `php artisan config:clear && php artisan cache:clear`
5. Verify a sample patient file and session record in the admin UI
6. `php artisan up`

## Docker / Sail

When using Laravel Sail, run backups from the `mysql` container or mount a `backups/` volume and schedule the script via cron on the host.

## Verification

- Test restore on a non-production instance at least **once per quarter**
- Log backup success/failure (cron mail or monitoring alert)
- Never store unencrypted backups on the same server without off-site replication

## Off-site copies

Copy encrypted backups to:

- S3 / object storage with versioning, or
- A separate backup server / cloud provider region

Use different credentials than the production database user for backup-only access where possible.
