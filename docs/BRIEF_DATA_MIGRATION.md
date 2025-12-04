# Campaign brief migration — briefData JSON

This document summarizes the non-destructive migration performed on the Campaign model to add a `briefData` JSON column, and explains how the application consumes campaign-level fields.

## High-level changes

- Introduced `briefData` (JSON) column in `Campaign` database model to store campaign brief and additional campaign fields such as `objective`, `launchType`, `funnelStage`, `placements`, and campaign-level creative constraints.
- Added `brandKitId` as a relation on `Campaign` pointing to the `BrandKit` model.
- Updated API routes to accept campaign-level fields in the request payload and pack them into `briefData` when persisting to the DB.
- Updated backend services to prefer `briefData` fields for campaign prompts and creative generation. Where `brief` existed, code now uses `(campaign.briefData as any) || campaign.brief` to preserve compatibility.
- Frontend now includes `briefData` in the Campaign type, and components read `campaign.briefData?.objective` before falling back to `campaign.objective`.

## Why `briefData`?

- `briefData` allows the application to evolve the schema for creative briefs quickly without requiring schema migrations for every new brief element.
- The brief is often a nested structure (audience, KPIs, tone, message), therefore storing in JSON is a pragmatic choice for quick iteration, while keeping important campaign columns normalized where needed.

## How the API behaves now

- POST `/api/campaigns`:
  - Accepts traditional top-level fields (e.g. `objective`, `launchType`, `funnelStage`, `placements`) and constructs `briefData` server-side.
  - Also accepts `brandKitId` (optional) to associate campaign with a brand kit; if provided, it will determine the workspace ID.
- GET `/api/campaigns` and `/api/campaigns/:id`:
  - Return `campaign.briefData` as part of the campaign object.
  - Frontend should read objective/funnel/placements from `briefData` whenever present, and fallback to existing top-level fields (if present).

## Developer notes

- Until all code paths are migrated to `briefData`, the code uses `(campaign.briefData as any) || campaign.brief` as a non-destructive compatibility pattern.
- For campaign prompts and content generation, services (ad copy, ad creatives, video scripts) should prefer `briefData` to ensure all elements are available.
- If there are first-class fields you'd like to query often (for analytics or indexing), consider adding a dedicated column and migrating out of `briefData` in the future.

## Recommended next steps

- Update all references in the codebase to only read from `briefData` and eliminate `campaign.brief` fallback.
- Keep tests updated to check both the old and new behavior while the migration is in-flight.
- Add integration tests for create/update campaign and ensure `briefData` is persisted properly.

## How to test the brief data flow manually

1. Start the backend dev server.
2. Ensure you have a workspace and a brand kit (POST `api/workspaces`, POST `api/brand-kits` or use the seeded defaults in dev).
3. Create a campaign with a payload that includes `objective`, `funnelStage`, `placements`, and `primaryCTA`.
4. Verify that the campaign returned contains `briefData` with those values.

If you have questions about converting `briefData` to first-class columns in the DB (for analytics/indexing), consider creating a migration plan that extracts commonly queried fields.

## Database migration details (dev)

- Migration file: `20251204111017_add_brand_kit_and_brief_data` (timestamp may vary)
- Commands used (dev):
  - npx prisma migrate dev --name add-brand-kit-and-briefData
  - npx prisma generate

## Quick test examples

- Create a campaign using brandKitId (server resolves workspaceId):
  curl -s -X POST http://localhost:3001/api/campaigns \
   -H "Content-Type: application/json" \
   -d '{"brandKitId":"<brandKitId>","name":"Test","objective":"awareness","launchType":"evergreen","funnelStage":"cold","placements":["ig-feed","ig-story"]}' | jq .

## Rollback plan (simple)

- If you need to roll back the migration: (1) Dump `Campaign` table if you need to keep a copy: `npx prisma db pull` and backup DB; (2) run `npx prisma migrate resolve --applied <migration>` to mark migration as rolled back (consult Prisma docs); (3) Revert schema in `prisma/schema.prisma` and apply migration accordingly.
  - Note: Because `briefData` is non-destructive (we only added a column), rolling back will drop `briefData` data unless you back it up; consider creating a script to migrate `briefData` contents back into top-level columns before rollback.
