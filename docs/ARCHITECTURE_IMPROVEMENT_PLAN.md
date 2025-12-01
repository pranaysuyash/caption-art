# Architecture Improvement Plan

Last Updated: 2025-12-01
Status: Draft
Related Docs: TECHNICAL_DEBT_REGISTER.md, VALIDATION_UNIFICATION_SPEC.md, OBSERVABILITY_SPEC.md, FRONTEND_REFACTOR_PLAN.md

## Vision

Evolve the system toward a modular, observable, secure, performant platform supporting scalable AI-driven media workflows with minimal coupling between delivery (frontend), orchestration (backend), and execution (lambdas/external APIs).

## Current State (Summary)

- Backend: Thin Express server orchestrating third-party APIs (OpenAI, Replicate, Gumroad) with mixed validation patterns and rudimentary error taxonomy.
- Frontend: Monolithic `App.tsx` coordinating upload, captioning, masking, rendering, history, exporting, and video recording.
- Infrastructure: Single CDK stack with broad SSM permission and coarse-grained Lambda configuration; missing runtime observability scaffolding.
- Lambdas: Parallel set replicating backend capabilities (potential drift risk).

## Guiding Architectural Principles

1. **Single Source of Truth** for validation & domain types.
2. **Separation of Concerns**: Orchestration vs computation vs presentation.
3. **Explicit Contracts**: Typed, versioned APIs + schema snapshots.
4. **Observability by Design**: Correlation IDs, structured logs, metric invariants.
5. **Security Least Privilege**: Narrow IAM, sanitized user input, prompt hygiene.
6. **Performance Efficiency**: Avoid redundant AI calls; introduce caching & concurrency controls.
7. **Extensibility**: Feature flags & model registry to streamline upgrades.

---

## Target Architecture (High-Level)

```
+----------------+          +---------------------+          +------------------+
| Frontend (SPA) |  HTTP    | API Layer (Express) |  Async   | Worker Functions |
| React/Vite     +--------->+ Validation / Routing +--------->+ AI Orchestrators |
|                |          | Auth / Rate Control |          | (Queue-driven)   |
+--------+-------+          +----+-----------------+          +--------+---------+
         |                        |                                        |
         | WebSocket / SSE        | REST                                   |
         v                        v                                        v
  +-------------+          +----------------+                      +------------------+
  | Realtime    |          | Caching Layer  |                      | External APIs    |
  | Preview     |          | (Redis)        |<--------------------> | OpenAI / Replicate|
  +-------------+          +----------------+                      +------------------+
```

### Key Evolutions

- Introduce async workers (later phase) for long-running image tasks.
- Add Redis (or alternative) for deduplication and idempotency.
- Enable SSE / WebSocket for progressive caption updates and export progress.

---

## Backend Refactors

| Goal                  | Change                                    | Outcome                    | Phase |
| --------------------- | ----------------------------------------- | -------------------------- | ----- |
| Unified validation    | Consolidate schemas; derive types         | Eliminate drift            | 1     |
| Error taxonomy        | Add structured error codes & service tags | Better analytics           | 2     |
| Config centralization | Model registry & feature flags            | Easy model upgrades        | 2     |
| Rate limiting tiers   | Endpoint-weighted strategies              | Controlled cost/UX balance | 3     |
| Caching layer         | Hash-based memoization                    | Reduced API spend          | 4     |
| Worker extraction     | Offload heavy tasks                       | Scalability & isolation    | 5     |

---

## Frontend Refactors

| Goal                           | Change                                                  | Outcome                 | Phase |
| ------------------------------ | ------------------------------------------------------- | ----------------------- | ----- |
| Reduce re-renders              | Separate compositor lifecycle                           | Lower CPU usage         | 2     |
| Eliminate duplicate mask calls | Single orchestration service                            | Lower cost, consistency | 1     |
| State modularization           | Introduce domain contexts (Upload/Caption/Mask/History) | Maintainability         | 2     |
| Accessibility                  | ARIA labels for emoji controls                          | WCAG compliance         | 1     |
| Shortcut abstraction           | Platform-aware mapping                                  | Improved UX             | 2     |
| History coherence              | Batch auto-save states                                  | Cleaner undo semantics  | 3     |
| Font persistence               | Local storage for custom fonts                          | User personalization    | 3     |
| Realtime feedback              | Progressive SSE updates                                 | Enhanced responsiveness | 4     |

---

## Infrastructure Enhancements

| Area                    | Issue                    | Change                                 | Phase |
| ----------------------- | ------------------------ | -------------------------------------- | ----- |
| WAF association         | Empty ARN risk           | Conditional resource creation          | 1     |
| IAM scope               | Broad SSM read           | Restrict to parameter ARNs             | 1     |
| CORS handling           | Missing at API GW        | Enable per resource with allowlist     | 2     |
| Observability           | No alarms/metrics        | CloudWatch alarms + structured logs    | 2     |
| Environment consistency | Manual secret mapping    | SSM Path convention + param validation | 1–2   |
| Cost optimization       | Uniform memory           | Profile and size per Lambda            | 3     |
| Deployment resilience   | Single bundle dependency | Pre-deploy build + artifact check      | 1     |
| Edge performance        | No CF cache policies     | Introduce caching headers              | 3     |

---

## Domain Service Layer

Introduce a shared `@caption-art/core` internal package containing:

- Validation schemas.
- Domain types (CaptionTask, MaskTask, StoryFrame).
- Error codes enumerations.
- Prompt sanitization utilities.
- Hashing & signature utilities.

Benefits: Eliminates divergence between Express and Lambda implementations.

---

## Observability Model (Summary)

Reference full details in `OBSERVABILITY_SPEC.md`.

- Correlation ID injected at request ingress.
- Structured JSON logs with fields: `timestamp`, `level`, `requestId`, `endpoint`, `durationMs`, `errorCode`, `retryCount`.
- Metrics: external call latency, retry counts, prompt rejection count, cache hit ratio.
- Distributed tracing: spans around external API calls (OpenTelemetry).

---

## Security Model Enhancements

Reference `SECURITY_REVIEW_SUPPLEMENT.md`.

- Prompt sanitization & length controls.
- Strict CORS allowlist with environment-driven configuration.
- License-related watermark enforcement.
- Per-endpoint rate limiting with cost weighting.
- IAM least privilege for SSM.

---

## Data Flow Changes (Example: Caption Generation)

Current:
Frontend → POST /api/caption (raw image) → BLIP → OpenAI → return variants.

Target (Phase 4–5):

1. Frontend uploads image → receives image hash.
2. POST /api/caption with image hash.
3. Backend checks cache; if miss publishes job to queue.
4. Worker processes BLIP + OpenAI; stores result in cache.
5. Frontend subscribes via SSE for incremental variants.

Benefits: Reduced duplicate computation; improved latency for repeated requests.

---

## Migration Strategy

| Phase | Duration | Key Deliverables                                                | Success Criteria                                   |
| ----- | -------- | --------------------------------------------------------------- | -------------------------------------------------- |
| 1     | 2 weeks  | Validation unification, WAF conditional, CORS fix, critical bug | All critical items resolved; tests green           |
| 2     | 3 weeks  | Error taxonomy, logging, frontend compositor fix, SSM scoping   | P95 caption latency stable; structured logs active |
| 3     | 3 weeks  | Rate tiers, history batching, memory profiling                  | Error rate < baseline; improved undo UX            |
| 4     | 4 weeks  | Caching layer, SSE progressive responses                        | Cache hit ratio ≥ 40% for repeated images          |
| 5     | 4 weeks  | Worker queue integration, license enforcement                   | External API cost reduced ≥ 25%                    |

---

## Risks & Mitigations

| Risk                             | Description                              | Mitigation                                              |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| Scope creep                      | Adding features mid-phase                | Formal change review; freeze after planning             |
| Cache inconsistency              | Stale caption results after model change | Versioned cache keys (model + hash)                     |
| Worker complexity                | Operational overhead                     | Start with simple FIFO; add retries later               |
| Observability overhead           | Performance impact                       | Sample debug logs; optimize log volume                  |
| Validation drift during refactor | Missed endpoints                         | Test coverage + contract tests + schema coverage report |

---

## Acceptance Criteria Examples

- Validation unification: All routes import schemas from single file; diff shows removed inline schemas; tests pass with auto-generated types.
- Structured logging: Log entries parse under JSON schema; correlation ID appears in >99% of requests.
- Frontend compositor fix: CPU usage (Chrome performance sample) drops ≥ 30% for rapid caption changes.
- Rate tiering: Distinct limits documented & enforced via middleware; tests simulate hitting per-tier thresholds.

---

## Decommission / Cleanup Plan

Post Phase 5:

- Remove deprecated manual validation code.
- Archive previous ad-hoc error formats.
- Consolidate Lambda logic into shared core package.
- Tag release and create architecture decision record (ADR) referencing this plan.

---

## ADR Suggestions (to be written separately)

1. ADR-001: Unified Validation via Zod.
2. ADR-002: Structured Logging with Pino.
3. ADR-003: Caption/Mask Caching Strategy.
4. ADR-004: Worker Offloading for Long-Running AI Tasks.
5. ADR-005: Prompt Sanitization Policy.

---

## Monitoring Dashboard (Future Outline)

Panels:

- Caption Request Throughput.
- Cache Hit Ratio.
- External API Latency (BLIP/OpenAI/RemBG).
- Prompt Injection Rejections.
- Rate Limit Throttle Count.
- License Verification Success %.

---

## Conclusion

This plan establishes a phased, principle-driven evolution path emphasizing reliability, observability, and cost efficiency while preserving velocity. It complements existing audit artifacts by adding forward-looking structure.

End of Plan.
