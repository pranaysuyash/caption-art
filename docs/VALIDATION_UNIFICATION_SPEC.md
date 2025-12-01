# Validation Unification Specification

Last Updated: 2025-12-01
Status: Draft
Related Docs: TECHNICAL_DEBT_REGISTER.md (Items 2, 6), ARCHITECTURE_IMPROVEMENT_PLAN.md

## Goal
Establish a single, authoritative source for all API request validation logic using Zod, enabling consistent error responses, schema evolution tracking, and automatic type derivation.

## Current Issues
| Issue | Description | Impact |
|-------|-------------|--------|
| Mixed manual validation | `verify` route uses manual checks; others use Zod | Inconsistent errors |
| Inline schema duplication | Story route defines its own schema | Drift risk |
| Repeated image URL logic | Caption & mask schemas repeat data URI rules | DRY violation |
| Keyword sanitization absent | No constraints beyond optional array | Prompt injection risk |
| Inconsistent response typing | Types in `types/api.ts` + schema inference not aligned | Two sources of truth |

---
## Design Principles
1. **Single Registry**: All request schemas exported from `schemas/validation.ts` (or new `schemas/index.ts`).
2. **Composable Helpers**: Shared validators (e.g., `imageUrlSchema`, `keywordsSchema`).
3. **Context Metadata**: Attach metadata (`rateWeight`, `securityTags`) for runtime policies.
4. **Type Alignment**: Generate TypeScript types solely via `z.infer<typeof Schema>`.
5. **Stable Error Shape**: Centralized transformation of Zod errors → consistent response object.
6. **Extensibility**: Future acceptance of versioned schema changes (`v1`, `v2`).

---
## Proposed Schema Layout
```ts
// schemas/validation.ts
import { z } from 'zod'

// Shared primitive schemas
export const imageUrlSchema = z.string()
  .min(1, 'Image URL cannot be empty')
  .refine(url => url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'), 'Invalid image URL format')
  .refine(url => !url.startsWith('data:image/') || /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(url), 'Invalid data URI format');

export const keywordsSchema = z.array(z.string().min(1).max(32).regex(/^[A-Za-z0-9\-_' ]+$/)).max(10).default([]);

// Caption request
export const CaptionRequestSchema = z.object({
  imageUrl: imageUrlSchema,
  keywords: keywordsSchema.optional()
}).meta({ rateWeight: 5, securityTags: ['image','prompt'] });

// Mask request
export const MaskRequestSchema = z.object({
  imageUrl: imageUrlSchema
}).meta({ rateWeight: 5, securityTags: ['image'] });

// Verify license request
export const VerifyRequestSchema = z.object({
  licenseKey: z.string().min(5, 'License key required').max(100)
}).meta({ rateWeight: 1, securityTags: ['license'] });

// Story next frame request
export const NextFrameRequestSchema = z.object({
  currentCaption: z.string().min(1).max(512),
  styleContext: z.string().min(1).max(256)
}).meta({ rateWeight: 6, securityTags: ['prompt','story'] });

// Export all schemas map for dynamic dispatch
export const Schemas = {
  caption: CaptionRequestSchema,
  mask: MaskRequestSchema,
  verify: VerifyRequestSchema,
  storyNextFrame: NextFrameRequestSchema
};

export type CaptionRequest = z.infer<typeof CaptionRequestSchema>;
export type MaskRequest = z.infer<typeof MaskRequestSchema>;
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;
export type NextFrameRequest = z.infer<typeof NextFrameRequestSchema>;
```

---
## Error Response Standardization
### Format
```json
{
  "error": "Validation error",
  "fields": [
    { "field": "imageUrl", "message": "Invalid image URL format" },
    { "field": "keywords[2]", "message": "Exceeds max length" }
  ],
  "requestId": "uuid",
  "code": "VALIDATION_FAILED"
}
```

### Rules
- All validation failures return HTTP 400.
- `fields` array always present for Zod failures.
- `code` fixed for client pattern matching.
- Include `requestId` for correlation.

---
## Runtime Integration
### Middleware Flow
1. Map request path → schema key (e.g., `/api/caption` → `caption`).
2. Parse body; if success attach typed object to `req.validated`.
3. On failure: respond with standardized error; skip route handler.
4. Route handlers consume `req.validated` instead of raw body.

### Type Augmentation
```ts
declare global {
  namespace Express {
    interface Request {
      validated?: unknown
    }
  }
}
```
(Or refined generics per route using wrapper function.)

### Rate Limiter Interaction
- Middleware reads `schema.meta.rateWeight` and accumulates cost before deciding to throttle.

### Observability Integration
- Log count of validation failures per endpoint.
- Add histogram for validation duration (if necessary; low priority).

---
## Migration Plan
| Step | Action | Risk | Mitigation |
|------|--------|------|------------|
| 1 | Implement schemas & central middleware | Overlook route | Create route-schema mapping test |
| 2 | Remove inline story schema | Minimal | Diff & test coverage |
| 3 | Replace verify manual validation | Slight response change | Document version bump |
| 4 | Update tests to use new error shape | Test churn | Snapshot tests |
| 5 | Deprecate manually defined request interfaces | Drift | ESLint rule banning duplicates |

---
## Testing Strategy
| Test Type | Scope | Notes |
|-----------|-------|-------|
| Unit | Each schema boundary conditions | Use property-based tests for imageUrl and keywords |
| Integration | Middleware + route combos | Confirm `req.validated` presence |
| Contract | Snapshot error shape | Freeze `VALIDATION_FAILED` response |
| Security | Prompt injection attempts | Ensure sanitized rejection |

### Property-Based Examples
- Generate valid/invalid URLs with fast-check.
- Generate keyword arrays with random sizes; ensure length enforcement.

---
## Acceptance Criteria
- All existing endpoints validated exclusively through centralized schemas.
- No manual validation logic remaining in routes.
- Test coverage: 100% of branches in middleware & schema file.
- Error response shape consistent across caption/mask/verify/story.
- Keywords sanitized and capped according to spec.

---
## Rollback Plan
If runtime regressions appear:
1. Feature flag new middleware (`VALIDATION_V2=true`).
2. Temporarily fall back to legacy per-route logic.
3. Collect failure diff logs.
4. Patch & re-enable V2.

---
## Tooling Recommendations
- ESLint custom rule: prohibit direct access to `req.body` in validated routes.
- CI script verifying each route has an associated schema entry.

---
## Open Questions
| Question | Resolution Path |
|----------|-----------------|
| Versioning needed now? | Start with v1; add v2 only on breaking changes |
| Response internationalization? | Not in initial scope; evaluate demand later |
| Should we expose schema introspection? | Possibly for auto-generated docs; later phase |

---
## Risks & Mitigation
| Risk | Mitigation |
|------|-----------|
| Missed edge-case validation | Property-based tests + manual review |
| Performance overhead | Benchmark parse time; combine simple refinements |
| Client breakage on verify endpoint | Communicate change log; maintain old code path via flag |

---
## Summary
Unified validation consolidates input handling, enhances security, and reduces maintenance overhead. This specification provides the structural blueprint to implement it safely and incrementally.

End of Specification.
