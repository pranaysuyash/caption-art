# Technical Debt Register

Last Updated: 2025-12-01
Status: Draft (Supplement to existing audit docs)

## Purpose
This register catalogs current technical debt items not fully covered or newly observed since the previous audit summaries. Each entry lists: Category, Description, Impact, Severity, Suggested Remediation, Effort Estimate, Dependencies, and Target Window.

Severity Scale: Critical | High | Medium | Low
Effort Scale (ideal engineer-days): XS (<0.5), S (0.5–1), M (2–3), L (4–7), XL (8+)

---
## Backend

### 1. Syntax Error in `services/openai.ts`
- Category: Reliability
- Description: Extra closing parenthesis at end of `rewriteCaption` causing runtime/compile failure.
- Impact: Caption variant generation completely breaks.
- Severity: Critical
- Remediation: Remove stray parenthesis; add unit test covering function return.
- Effort: XS
- Dependencies: None
- Target: Immediate (Hotfix)

### 2. Inconsistent Validation Strategy
- Category: Consistency / Maintainability
- Description: Mixed manual (verify route) and Zod schema usage; story route defines inline schema.
- Impact: Increased risk of drift; harder auditing; uneven error messages.
- Severity: High
- Remediation: Centralize all request schemas in `schemas/validation.ts`; generate types from inference.
- Effort: M
- Dependencies: VALIDATION_UNIFICATION_SPEC
- Target: Sprint 1

### 3. Non-Cancellable External Calls
- Category: Performance / Resource Management
- Description: `withRetry` only races with timeout promise; underlying API call continues.
- Impact: Wasted network & compute; potential concurrency saturation under load.
- Severity: Medium
- Remediation: Introduce AbortController where clients support it; propagate cancellation.
- Effort: M
- Dependencies: Library capability (OpenAI, Replicate SDK updates)
- Target: Sprint 2

### 4. Error Taxonomy Narrowness
- Category: Observability
- Description: Error classes lack structured codes (retryable, external, validation).
- Impact: Harder analytics, alert routing.
- Severity: Medium
- Remediation: Introduce `code`, `service`, `retryable` fields; update handler & tests.
- Effort: M
- Dependencies: OBSERVABILITY_SPEC
- Target: Sprint 2–3

### 5. Overly Restrictive Production Rate Limit
- Category: UX / Scalability
- Description: 5 requests / 15 min per IP may frustrate legitimate usage.
- Impact: Churn risk, support load.
- Severity: High
- Remediation: Implement tiered limits (health: high, AI endpoints: moderate, burst allowances).
- Effort: M
- Dependencies: Roadmap scheduling
- Target: Sprint 3

### 6. Missing Keyword Sanitization
- Category: Security
- Description: `rewriteCaption` directly interpolates user-provided keywords into prompt.
- Impact: Prompt injection, token/latency inflation.
- Severity: High
- Remediation: Limit length (<= 32 chars each), max count (<= 10), regex whitelist.
- Effort: S
- Dependencies: Validation unification
- Target: Sprint 1

### 7. NaN Risk on Temperature Parsing
- Category: Reliability
- Description: Invalid `OPENAI_TEMPERATURE` string yields NaN silently.
- Impact: Undefined model behavior; edge-case failures.
- Severity: Medium
- Remediation: Clamp, validate numeric range [0,2]; fallback to default.
- Effort: XS
- Target: Sprint 1

### 8. Lack of Caching for Identical Image Requests
- Category: Performance / Cost
- Description: Recomputes captions/masks for same image multiple times.
- Impact: External API cost growth.
- Severity: Medium
- Remediation: Introduce hash-based memo (content SHA-256) with TTL.
- Effort: L
- Dependencies: Redis or in-memory + invalidation design
- Target: Sprint 4

### 9. Hard-Coded SDXL Model String
- Category: Config Hygiene
- Description: Model reference lives inline in `generateImage`.
- Impact: Harder upgrades; inconsistent with config centralization.
- Severity: Low
- Remediation: Add to `config.ts` with env override.
- Effort: XS
- Target: Sprint 1

### 10. Gumroad 200 for Invalid License
- Category: Semantics
- Description: Always returns 200 even on invalid license.
- Impact: Confusing API consumers; forces branch logic client-side.
- Severity: Medium
- Remediation: Return 400 or 422 for invalid license; keep 200 for valid.
- Effort: S
- Dependencies: Consumer impact evaluation
- Target: Sprint 2

### 11. CORS Credentials with Wildcard
- Category: Security / Standards Compliance
- Description: `Access-Control-Allow-Credentials: true` while origin may be `*`.
- Impact: Browser ignores credentials; ambiguous policy.
- Severity: High
- Remediation: Only set credentials if origin is explicit match; adopt allowlist.
- Effort: S
- Target: Sprint 1

### 12. Per-Request Client Instantiation
- Category: Performance
- Description: New OpenAI / Replicate clients for each call.
- Impact: Increased latency and overhead.
- Severity: Medium
- Remediation: Implement lightweight client factory with reuse.
- Effort: M
- Target: Sprint 3

---
## Frontend

### 13. Compositor Re-Creation on Minor State Changes
- Category: Performance
- Description: `useEffect` dependency list triggers full compositor rebuild frequently.
- Impact: Frame drops, battery drain.
- Severity: High
- Remediation: Separate initialization vs incremental updates; maintain stable ref.
- Effort: M
- Dependencies: FRONTEND_REFACTOR_PLAN
- Target: Sprint 2

### 14. Duplicate Mask Generation Paths
- Category: Cost / Logic
- Description: Hidden `MaskGenerator` + manual fetch run concurrently.
- Impact: Double API calls; inconsistent state.
- Severity: High
- Remediation: Choose one orchestration path; remove hidden component usage.
- Effort: S
- Target: Sprint 1

### 15. Inline Hard-Coded Debounce Values
- Category: Consistency
- Description: 150ms appears both inline and in config.
- Impact: Drift risk.
- Severity: Low
- Remediation: Use `UI_CONFIG` constant exclusively.
- Effort: XS
- Target: Sprint 1

### 16. Keyboard Shortcut Platform Mismatch
- Category: UX
- Description: `Ctrl+S` only; Mac users expect `Cmd`.
- Impact: Reduced adoption of shortcuts.
- Severity: Medium
- Remediation: Detect platform / unify mapping (`metaKey`).
- Effort: S
- Target: Sprint 2

### 17. History & Auto-Save Interaction Ambiguity
- Category: Reliability
- Description: Auto-save may record states between rapid edits making undo unintuitive.
- Impact: Frustration, state confusion.
- Severity: Medium
- Remediation: Batch changes; tag auto-saved states differently.
- Effort: M
- Target: Sprint 3

### 18. Unbounded Captions Array Growth
- Category: Memory
- Description: Captions appended indefinitely.
- Impact: Memory footprint increase over long sessions.
- Severity: Low
- Remediation: Cap list length (e.g., 50) & prune oldest.
- Effort: XS
- Target: Sprint 2

### 19. Incomplete Accessibility for Emoji Buttons
- Category: Accessibility
- Description: Missing `aria-label` for platform toggles.
- Impact: Screen reader ambiguity.
- Severity: Medium
- Remediation: Add explicit ARIA attributes.
- Effort: XS
- Target: Sprint 1

### 20. Mask Regeneration No Abort Capability
- Category: UX / Performance
- Description: Long-running mask fetch cannot be cancelled on new upload.
- Impact: Late state overwrites.
- Severity: Medium
- Remediation: Use AbortController; clear pending.
- Effort: M
- Target: Sprint 3

---
## Infrastructure (CDK)

### 21. WAF ACL Empty ARN Association
- Category: Deployment Reliability
- Description: If `WAF_ACL_ARN` not set, association uses empty string.
- Impact: Possible invalid CFN resource; wasted deploy attempts.
- Severity: High
- Remediation: Conditional resource creation.
- Effort: S
- Target: Sprint 1

### 22. Overly Broad SSM Policy
- Category: Security
- Description: `ssm:GetParameter` on `*`.
- Impact: Excessive privilege escalation risk.
- Severity: High
- Remediation: Restrict to parameter ARNs.
- Effort: S
- Target: Sprint 1

### 23. Missing API Gateway CORS
- Category: Integration Reliability
- Description: No explicit CORS config; mismatch with frontend expectations.
- Impact: Preflight failures on deployed stack.
- Severity: High
- Remediation: Define CORS per resource.
- Effort: M
- Target: Sprint 2

### 24. Uniform Lambda Memory Allocation
- Category: Cost Optimization
- Description: All Lambdas at 512MB regardless of workload.
- Impact: Over/under-provisioning.
- Severity: Medium
- Remediation: Profile usage; adjust memory + concurrency.
- Effort: M
- Target: Sprint 3

### 25. Missing Alarm / Monitoring Set
- Category: Observability
- Description: No CloudWatch alarms (errors, throttles).
- Impact: Delayed incident detection.
- Severity: High
- Remediation: Implement baseline alarm set.
- Effort: S
- Dependencies: OBSERVABILITY_SPEC
- Target: Sprint 2

---
## Cross-Cutting

### 26. Lack of Unified Config for Models & Feature Flags
- Category: Maintainability
- Description: Hard-coded model strings; no feature toggles.
- Impact: Slower iteration.
- Severity: Medium
- Remediation: Extend config with feature flags & model registry.
- Effort: M
- Target: Sprint 2

### 27. Missing Structured Logging
- Category: Observability
- Description: Console logs only; no JSON format.
- Impact: Harder aggregation.
- Severity: Medium
- Remediation: Introduce pino/winston with correlation IDs.
- Effort: M
- Target: Sprint 2

### 28. No Prompt Injection Safeguards
- Category: Security
- Description: Plain concatenation of user data into prompts.
- Impact: Model misuse, unexpected outputs.
- Severity: High
- Remediation: Escape newline/control chars; cap token length.
- Effort: S
- Target: Sprint 1

### 29. Absence of Cache Strategy Document
- Category: Performance Planning
- Description: Optimization ideas not formalized.
- Impact: Ad hoc decisions.
- Severity: Low
- Remediation: Draft caching strategy (image, caption, mask).
- Effort: S
- Target: Sprint 4

### 30. Incomplete License Enforcement Logic
- Category: Product Integrity
- Description: Watermark toggling stub; license always true.
- Impact: Revenue leakage potential.
- Severity: Medium
- Remediation: Implement license gating & watermark fallback.
- Effort: M
- Target: Sprint 3

---
## Prioritization Summary
| ID | Severity | Effort | Scheduled Sprint (Proposed) |
|----|----------|--------|-----------------------------|
| 1  | Critical | XS     | Hotfix Pre-Sprint           |
| 2  | High     | M      | 1                           |
| 6  | High     | S      | 1                           |
| 11 | High     | S      | 1                           |
| 14 | High     | S      | 1                           |
| 21 | High     | S      | 1                           |
| 22 | High     | S      | 1                           |
| 7  | Medium   | XS     | 1                           |
| 9  | Low      | XS     | 1                           |
| 13 | High     | M      | 2                           |
| 16 | Medium   | S      | 2                           |
| 23 | High     | M      | 2                           |
| 25 | High     | S      | 2                           |
| 27 | Medium   | M      | 2                           |
| 3  | Medium   | M      | 2–3                         |
| 4  | Medium   | M      | 2–3                         |
| 5  | High     | M      | 3                           |
| 12 | Medium   | M      | 3                           |
| 17 | Medium   | M      | 3                           |
| 30 | Medium   | M      | 3                           |
| 8  | Medium   | L      | 4                           |
| 29 | Low      | S      | 4                           |

---
## Tracking & Metrics
Recommended KPIs:
- Mean external caption latency (p50/p95).
- Retry rate per external provider.
- Prompt injection rejections per 1K requests.
- CORS preflight failure count.
- License validation success ratio.
- Frontend compositor render duration (avg per state change).

---
## Review Cadence
- Weekly standup: Re-assess critical items.
- Sprint planning: Confirm next top 5.
- Monthly architecture review: Re-score unresolved medium/high items.

---
## Exit Criteria for Debt Closure
An item is considered resolved when:
1. Code change merged addressing remediation.
2. Tests added (unit + integration if applicable).
3. Observability hooks updated (logs/metrics).
4. Documentation references updated (ROADMAP, SPECs).
5. KPI impact measured or baseline captured.

---
## Appendix
Linkage:
- See `ARCHITECTURE_IMPROVEMENT_PLAN.md` for structural changes aligning with items 2, 3, 13.
- See `VALIDATION_UNIFICATION_SPEC.md` for item 2 & 6 implementation guidance.
- See `OBSERVABILITY_SPEC.md` for items 4, 25, 27.
- See `FRONTEND_REFACTOR_PLAN.md` for items 13, 14, 17.

End of Register.
