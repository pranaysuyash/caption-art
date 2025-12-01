# Q1 2026 Roadmap

Period: 2026-01-01 → 2026-03-31
Last Updated: 2025-12-01
Status: Draft
Related Docs: TECHNICAL_DEBT_REGISTER.md, ARCHITECTURE_IMPROVEMENT_PLAN.md, OBSERVABILITY_SPEC.md

## Strategic Themes
1. **Reliability & Consistency** – Unified validation, structured error taxonomy.
2. **Performance & Cost Efficiency** – Compositor optimization, rate tiering, caching foundation.
3. **Security & Compliance** – Prompt sanitization, IAM scope reduction, CORS hardening.
4. **Observability Maturity** – Metrics, tracing, actionable dashboards.
5. **Frontend Experience Quality** – Modular state, accessibility, improved undo semantics.

---
## Quarterly Objectives (OKRs)
| Objective | Key Result | Target |
|-----------|------------|--------|
| Reduce caption API cost | 20% decrease in external API calls via dedupe | ≥ 20% |
| Improve reliability | External API error rate under 2% (p30) | ≤ 2% |
| Enhance UX responsiveness | Frontend caption first variant p75 < 2200ms | < 2200ms |
| Strengthen security posture | 100% requests validated by unified schemas | 100% |
| Increase observability coverage | 90% of endpoints traced & metered | ≥ 90% |

---
## Milestone Breakdown
| Month | Milestone | Deliverables |
|-------|-----------|--------------|
| Jan (Weeks 1–4) | Foundational Consistency | Validation Unification; Security Phase 1; WAF conditional fix; CORS allowlist; Mask generation dedup |
| Feb (Weeks 5–8) | Observability & Performance | Structured logging; Error taxonomy; Compositor optimization; Rate tiering; Initial dashboards |
| Mar (Weeks 9–13) | Optimization & Caching | Cache layer (image/caption/mask); History/auto-save refinement; License enforcement token; Abortable operations |

---
## Detailed Timeline (Week-Level)
| Week | Focus | Key Tasks |
|------|-------|----------|
| 1 | Kickoff & Planning | Sprint planning; finalize schemas; ADR drafts (Validation, Logging) |
| 2 | Validation Implementation | Central middleware; migrate routes; snapshot tests |
| 3 | Security Phase 1 | Keyword sanitization; IAM narrowing; CORS fix; WAF conditional deploy |
| 4 | Mask Dedup & Minor Fixes | Remove hidden component; fix openai syntax error; debounce config alignment |
| 5 | Logging & Tracing | Integrate pino; requestId; basic metrics counters; OTEL spans setup |
| 6 | Error Taxonomy | Add structured error fields; update tests; log enrichment |
| 7 | Compositor Optimization | Refactor lifecycle; provider extraction (Upload/Mask/Caption) |
| 8 | Rate Tiering | Implement cost-weighted limiter; metrics for throttles; dashboard update |
| 9 | Caching Foundation | Image hash util; caption/mask cache; eviction policy design |
| 10 | License Enforcement | JWT issuance; watermark gating; export logic integration |
| 11 | History Refinement | Committed vs transient states; undo tests; UI feedback |
| 12 | Abortable Operations | Implement AbortController integration for mask/caption; reliability tests |
| 13 | Hardening & Review | Performance benchmarks; OKR progress report; backlog grooming |

---
## Dependencies & Sequencing
| Task | Depends On | Reason |
|------|------------|--------|
| Rate Tiering | Validation Unification | Needs schema meta rateWeight |
| Compositor Optimization | Provider extraction | Requires modular state isolation |
| Caching Foundation | Structured logging | Observability for hit ratio & latency |
| License Enforcement | Security Phase 1 | Relies on sanitized inputs & stable validation |
| Abortable Operations | Provider extraction | Central orchestration path simplifies cancellation |

---
## Resource Allocation (Assuming 3 Engineers)
| Role | Jan | Feb | Mar |
|------|-----|-----|-----|
| Backend Engineer | Validation, Security | Logging, Rate Tiering | Cache, License |
| Frontend Engineer | Mask Dedup, Providers | Compositor Optimization | History, Abortable Ops |
| Full-stack Engineer | CORS/WAF, Fixes | Error taxonomy, Dashboard | Cache integration, Performance reviews |

---
## KPI Instrumentation Points
| KPI | Instrumented When | Metric Source |
|-----|-------------------|--------------|
| Caption cost reduction | Cache layer release | Cache hit ratio + external calls |
| External error rate | Logging + taxonomy | `external_call_duration_ms` & error counters |
| Caption latency p75 | Compositor + abortable ops | Frontend RUM `caption_first_variant_latency_ms` |
| Unified validation coverage | Validation rollout | Validation middleware success vs total requests |
| Tracing coverage | OTEL spans added | Trace sampling stats |

---
## Risk Register (Roadmap-Specific)
| Risk | Phase | Mitigation |
|------|-------|-----------|
| Migration complexity for validation | Jan | Feature flag `VALIDATION_V2`; fallback path |
| Performance regression from logging overhead | Feb | Benchmarks pre/post; adjust sampling |
| Cache stale outputs after model update | Mar | Model version key strategy & invalidation tests |
| License feature rollout confusion | Mar | Clear API docs + frontend watermark messaging |
| Undo semantics user friction | Mar | Tooltip & short onboarding overlay |

---
## Success Measurement
- Mid-Q review (Week 7): Validate progress vs timeline; adjust backlog.
- End-Q retrospective: Compare OKRs with actual metrics; produce improvement recommendations.

---
## Backlog Items Deferred Post-Q1
| Item | Reason for Deferral |
|------|---------------------|
| Worker queue extraction | Focus first on reliability & caching |
| SSE progressive updates | Requires streaming infra and worker readiness |
| Adaptive sampling for tracing | Baseline instrumentation needed first |
| Web Worker offloading | Await performance profiling evidence |

---
## Communication Plan
| Audience | Cadence | Artifact |
|----------|---------|---------|
| Engineering | Weekly | Sprint summary & metrics snapshot |
| Product | Monthly | KPI progress & risk update |
| Stakeholders | End of Q | OKR attainment report |

---
## Exit Criteria (End of Q1)
1. All external-facing endpoints use unified validation.
2. Structured logging + baseline metrics visible in dashboards.
3. Cache hit ratio ≥ initial target OR documented plan to improve.
4. Caption latency p95 improvement measured (target stabilization or reduction).
5. License enforcement functional with test coverage.
6. Accessibility improvements verified (axe zero critical issues for toolbar/modals).

---
## Appendices
- See `FRONTEND_REFACTOR_PLAN.md` for provider extraction specifics.
- See `VALIDATION_UNIFICATION_SPEC.md` for schema details (Jan objective).
- See `OBSERVABILITY_SPEC.md` for metrics definitions.

End of Roadmap.
