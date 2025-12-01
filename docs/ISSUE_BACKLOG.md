# Issue Backlog & Work Item Breakdown

Last Updated: 2025-12-01
Status: Draft
Related Docs: TECHNICAL_DEBT_REGISTER.md, ROADMAP_Q1_2026.md

## Format

Each item includes: ID (links to debt register), Type, Description, Acceptance Criteria, Dependencies, Estimation, Labels.

Labels: `backend`, `frontend`, `infra`, `security`, `performance`, `observability`, `ux`, `refactor`.

---

## Epics Overview

| Epic                      | Description                         | Related IDs | Goal                      |
| ------------------------- | ----------------------------------- | ----------- | ------------------------- |
| E1 Validation Unification | Centralize all schema logic         | 2,6         | Consistent input handling |
| E2 Security Foundations   | Sanitization, IAM narrowing, CORS   | 6,11,22,28  | Reduce attack surface     |
| E3 Observability Core     | Structured logs & metrics           | 4,25,27     | Improve diagnosis speed   |
| E4 Frontend Performance   | Compositor + duplicate call removal | 13,14       | Lower latency & CPU       |
| E5 Rate Strategy          | Weighted tiered limits              | 5           | Balance cost vs UX        |
| E6 Caching Layer          | Hash-based caption/mask reuse       | 8           | External cost reduction   |
| E7 License Enforcement    | Token-based gating & watermark      | 30          | Product integrity         |
| E8 History/Undo Coherence | Transient vs committed states       | 17          | Predictable undo UX       |
| E9 Accessibility Upgrade  | ARIA labels, modal semantics        | 19          | WCAG compliance           |

---

## Backlog Items

### B1 – Fix `openai.ts` Syntax Error (ID 1)

- Type: Bug
- Description: Remove extraneous parenthesis causing failure.
- Acceptance: Build succeeds; unit test calls `rewriteCaption` returns array length ≤5.
- Dependencies: None
- Estimate: XS
- Labels: backend, reliability

### B2 – Unified Validation Middleware (ID 2)

- Type: Feature
- Description: Implement central Zod-based middleware and route mapping.
- Acceptance: All routes use `req.validated`; manual validation removed; tests updated.
- Dependencies: B1
- Estimate: M
- Labels: backend, security, refactor

### B3 – Keyword Sanitization (ID 6 / spec)

- Type: Security
- Description: Enforce keyword length & charset constraints.
- Acceptance: Requests with invalid keywords → 400 with structured field errors.
- Dependencies: B2
- Estimate: S
- Labels: backend, security

### B4 – CORS Credentials Policy Correction (ID 11)

- Type: Security
- Description: Disallow credentials when origin is `*`; allow only matched allowlist.
- Acceptance: Preflight success for allowed origins; rejection for others; tests.
- Dependencies: None
- Estimate: S
- Labels: backend, security

### B5 – IAM Scope Reduction (ID 22)

- Type: Security / Infra
- Description: Replace wildcard SSM policy with path-scoped resources.
- Acceptance: CDK synth shows restricted ARNs only; deploy success.
- Dependencies: None
- Estimate: S
- Labels: infra, security

### B6 – Structured Logging Introduction (ID 27)

- Type: Observability
- Description: Implement pino logger with requestId injection.
- Acceptance: Log sample passes JSON schema; correlation across external calls.
- Dependencies: B2
- Estimate: M
- Labels: backend, observability

### B7 – Error Taxonomy Expansion (ID 4)

- Type: Observability
- Description: Add error codes, `retryable`, `service` fields.
- Acceptance: Error responses include new structure; tests validate mapping.
- Dependencies: B6
- Estimate: M
- Labels: backend, observability

### B8 – Rate Limiting Tiering (ID 5)

- Type: Feature
- Description: Weighted endpoint limit strategy.
- Acceptance: Configurable cost weights; hitting combined threshold returns 429; metrics exposed.
- Dependencies: B2
- Estimate: M
- Labels: backend, performance

### B9 – Compositor Lifecycle Refactor (ID 13)

- Type: Refactor
- Description: Maintain stable instance; incremental updates.
- Acceptance: Instance preserved across text/style changes; measured CPU drop ≥25% vs baseline.
- Dependencies: B10
- Estimate: M
- Labels: frontend, performance

### B10 – Provider Extraction (ID 14, 17 partially)

- Type: Refactor
- Description: Introduce Upload/Caption/Mask providers; remove hidden mask component.
- Acceptance: Single mask request per image; provider tests passing.
- Dependencies: None
- Estimate: M
- Labels: frontend, refactor

### B11 – Undo/History Coherence (ID 17)

- Type: UX
- Description: Differentiate transient vs committed states.
- Acceptance: Undo after rapid typing returns to previous committed state; tests cover scenarios.
- Dependencies: B10
- Estimate: M
- Labels: frontend, ux

### B12 – Prompt Injection Safeguards (ID 28)

- Type: Security
- Description: Escape control chars; enforce length caps.
- Acceptance: Malicious prompt attempts rejected & counted metric.
- Dependencies: B3
- Estimate: S
- Labels: backend, security

### B13 – NaN Temperature Guard (ID 7)

- Type: Reliability
- Description: Validate & clamp temperature range.
- Acceptance: Invalid input replaced by default; test ensures fallback.
- Dependencies: None
- Estimate: XS
- Labels: backend

### B14 – Caption/Mask Caching (ID 8)

- Type: Performance
- Description: Hash content & store results with TTL.
- Acceptance: Subsequent identical requests return cached result; hit ratio metric exposed.
- Dependencies: B6
- Estimate: L
- Labels: backend, performance

### B15 – License Enforcement & Watermark (ID 30)

- Type: Feature / Security
- Description: JWT token issuance; watermark if invalid/unlicensed.
- Acceptance: Export includes watermark for unlicensed; valid license removes it.
- Dependencies: B2, B6
- Estimate: M
- Labels: backend, frontend, security

### B16 – Mask & Caption Abortable Ops (ID 20 implied)

- Type: Reliability / UX
- Description: AbortController integration for in-flight requests.
- Acceptance: Starting new upload aborts previous generation; tests verify cancellation.
- Dependencies: B10
- Estimate: M
- Labels: frontend, performance

### B17 – Accessibility Enhancements (ID 19)

- Type: Accessibility
- Description: Add ARIA labels; focus traps; live regions.
- Acceptance: Axe tests show zero critical issues; manual screen reader check passes.
- Dependencies: B10
- Estimate: S
- Labels: frontend, ux

### B18 – Structured Metrics Exposure (IDs 6,25)

- Type: Observability
- Description: Prometheus metrics for requests, retries, latency.
- Acceptance: `/metrics` endpoint returns defined series; values change under load tests.
- Dependencies: B6
- Estimate: M
- Labels: backend, observability

### B19 – WAF Conditional Fix (ID 21)

- Type: Infra
- Description: Only associate if ARN provided.
- Acceptance: Deploy without ARN succeeds; with ARN associates properly.
- Dependencies: None
- Estimate: S
- Labels: infra, security

### B20 – Redis Integration for Cache (ID 8 expansion)

- Type: Infra / Performance
- Description: Add Redis cluster for scaling caching beyond memory.
- Acceptance: Cache driver abstracted; failover to memory; integration tests.
- Dependencies: B14
- Estimate: L
- Labels: backend, infra, performance

### B21 – Structured Caption Error Handling (IDs 4,7 synergy)

- Type: Observability
- Description: Map external failures to standardized errors.
- Acceptance: External API timeouts produce `EXT_API_TIMEOUT` code & metrics increment.
- Dependencies: B7
- Estimate: S
- Labels: backend, observability

### B22 – History Persistence (Optional Future)

- Type: Enhancement
- Description: Persist committed states to local storage or IndexedDB.
- Acceptance: Reload restores last state; user toggle to disable.
- Dependencies: B11
- Estimate: M
- Labels: frontend, ux

---

## Dependency Graph (Simplified)

```
B1 → B2 → B3 → B12
B2 → B6 → B7 → B21
B10 → B9, B11, B16, B17
B6 → B14 → B20
B2 + B6 → B15
```

---

## Story Templates

Use standard user story formatting:

```
As a <role>, I want <capability>, so that <benefit>.
```

Example (B14):
"As a returning user, I want identical image caption requests to respond faster so that I save time and reduce API cost." Acceptance: hashed identical image returns response ≤ 250ms (mocked) vs original > 1s.

---

## Estimation Summary

| Size | Hours (Approx) |
| ---- | -------------- |
| XS   | 1–2            |
| S    | 4–6            |
| M    | 12–20          |
| L    | 25–40          |
| XL   | 50+            |

---

## Sprint Planning Guidance

- Include max 1 L-sized item per sprint.
- Pair observability tasks (B6 + B18) with performance tasks (B9) for synergy.
- Reserve buffer (≈20%) for emergent bugs or integration friction.

---

## Acceptance Criteria Quality Checklist

| Criterion     | Must Have                                 |
| ------------- | ----------------------------------------- |
| Deterministic | Tests objectively confirm result          |
| Observable    | Metric or log proving outcome             |
| Resilient     | Handles edge cases (e.g., empty keywords) |
| Documented    | Linked spec or ADR for context            |
| Non-breaking  | Backwards compatibility considered        |

---

## Monitoring Post-Completion

- Add watch tasks to verify no regression in cache hit ratio (B14/B20).
- Track external error code distribution after taxonomy rollout (B7/B21).

---

## Items to Park (Future Consideration)

| Item                              | Rationale                                 |
| --------------------------------- | ----------------------------------------- |
| SSE Progressive Caption Streaming | Requires worker queue foundation          |
| Adaptive Trace Sampling           | Needs baseline trace volume data          |
| Advanced Prompt Risk Scoring      | Optional after basic sanitization metrics |

---

## Summary

This backlog operationalizes architectural and technical debt remediation into actionable, testable units aligned with quarterly goals. It provides dependency clarity and acceptance rigor to facilitate predictable delivery.

End of Backlog.
