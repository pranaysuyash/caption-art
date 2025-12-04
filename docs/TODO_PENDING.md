# Pending Work (Snapshot)

## High Priority
- [ ] Migrate runtime to DB-backed Prisma (replace in-memory AuthModel) for captions, assets, approvals, exports, batch jobs.
- [ ] Export flow validation: approve captions → start export → poll → download ZIP; surface progress/error states in UI.
- [ ] Legacy cleanup: remove playground from primary flow; simplify backend route loader.
- [ ] Campaign routes: ensure all new fields remain consistent in briefData updates and responses (placements, must include/exclude, reference captions, headline/body limits, keywords, secondary CTA).

## Database (postpone per instruction)
- [ ] Switch Prisma datasource to Postgres (`provider = "postgresql"`, `DATABASE_URL`), run migrations against Postgres.
- [ ] Seed minimal data and verify prisma migrate deploy in CI/ops.

## UX/Frontend
- [ ] Brand Kit UI polish: add logo upload helper/validation; ensure phrases/keywords display cleanly; consider masking model defaults.
- [ ] Error/loading UX: actionable toasts, progress indicators on approval/export flows.

## Testing
- [ ] End-to-end workflow tests: upload → generate → approve → export (with Prisma).
- [ ] Playwright/visual tests cleanup (report artifacts removed; rerun to green).

## Security/Config
- [ ] Recheck rate limits/validation (input sanitization) once DB-backed; confirm no secrets in frontend envs.
