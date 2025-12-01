# Observability Specification

Last Updated: 2025-12-01
Status: Draft
Related Docs: ARCHITECTURE_IMPROVEMENT_PLAN.md, TECHNICAL_DEBT_REGISTER.md, SECURITY_REVIEW_SUPPLEMENT.md

## Objectives

Provide complete visibility into performance, reliability, cost drivers, and security posture across backend, frontend interactions, and infrastructure services.

## Pillars

1. **Logging** – Structured, contextual, low-noise.
2. **Metrics** – Quantitative health & saturation signals.
3. **Tracing** – Latency breakdown across external calls.
4. **Profiling** – Targeted performance investigation (later phase).
5. **Dashboards & Alerts** – Actionable SLO monitoring.

---

## Logging

### Format

Use JSON lines with the following base schema:

```json
{
  "timestamp": "2025-12-01T12:00:00.000Z",
  "level": "info|warn|error|debug",
  "requestId": "uuid-v4",
  "sessionId": "optional-user-session",
  "component": "api|frontend|worker|lambda",
  "endpoint": "/api/caption",
  "method": "POST",
  "statusCode": 200,
  "durationMs": 123,
  "errorCode": "EXT_API_TIMEOUT",
  "externalService": "OpenAI|Replicate|Gumroad",
  "retryCount": 2,
  "cacheHit": false,
  "rateTier": "caption-high-cost",
  "payloadSizeBytes": 84231,
  "securityContext": { "ipHash": "sha256" },
  "tags": ["caption", "ai"]
}
```

### Correlation

- Generate `requestId` at ingress (Express middleware) if header absent.
- Propagate to worker jobs & external calls (inject into OpenTelemetry span attributes).

### Redaction Rules

- Replace emails: `a***@domain.com`
- Omit raw base64 image data from logs; log size and hash only.
- Mask secrets matching regex patterns (API keys) → `***REDACTED***`.

### Log Levels Guidance

| Level | Usage                                                              |
| ----- | ------------------------------------------------------------------ |
| debug | Development-only granular events (disabled in prod)                |
| info  | Request completion, cache hits, retries                            |
| warn  | Soft failures, partial degradation, slow responses p95 > threshold |
| error | Failed requests, uncaught exceptions, external API errors          |

### Sampling

- Full logging for errors & warns.
- Info logs may be sampled (e.g., 70%) if volume exceeds ingestion budget.

---

## Metrics

### Backend Metrics

| Metric                            | Type      | Labels                       | Description                        |
| --------------------------------- | --------- | ---------------------------- | ---------------------------------- |
| http_requests_total               | Counter   | endpoint, method, statusCode | Request throughput                 |
| http_request_duration_ms          | Histogram | endpoint, method             | Latency distribution               |
| external_call_duration_ms         | Histogram | service                      | OpenAI/Replicate/Gumroad latencies |
| external_call_retries_total       | Counter   | service                      | Retries initiated                  |
| cache_hits_total                  | Counter   | resourceType                 | Caption/mask cache hits            |
| cache_miss_total                  | Counter   | resourceType                 | Misses for caching                 |
| prompt_injection_blocked_total    | Counter   |                              | Blocked unsafe prompts             |
| rate_limiter_block_total          | Counter   | endpoint                     | Throttled requests                 |
| payload_rejected_total            | Counter   | reason                       | Oversized or invalid payloads      |
| license_verification_failed_total | Counter   |                              | Invalid license attempts           |

### Frontend Metrics (Collected via beacon / RUM)

| Metric                           | Type      | Description                          |
| -------------------------------- | --------- | ------------------------------------ |
| compositor_render_time_ms        | Histogram | Time to redraw on text/style change  |
| upload_preprocess_time_ms        | Histogram | Time from file select to ready state |
| caption_first_variant_latency_ms | Histogram | Time until first caption displayed   |
| mask_generation_latency_ms       | Histogram | Time from request to mask available  |
| export_duration_ms               | Histogram | Time to complete image export        |

### Infrastructure Metrics

| Metric                   | Type      | Description                 |
| ------------------------ | --------- | --------------------------- |
| lambda_invocations_total | Counter   | Per function throughput     |
| lambda_duration_ms       | Histogram | Execution time distribution |
| lambda_errors_total      | Counter   | Failed invocations          |
| waf_blocks_total         | Counter   | Requests blocked by WAF     |

---

## Tracing (OpenTelemetry)

### Span Hierarchy Example (Caption Request)

```
Request /api/caption (root span)
  ├─ Validate input
  ├─ Cache lookup (caption-hash)
  ├─ Replicate BLIP call
  ├─ OpenAI rewrite call
  ├─ Cache store
  └─ Response serialization
```

### Span Attributes

| Attribute        | Value          |
| ---------------- | -------------- | ------------------- |
| request.id       | requestId      |
| endpoint         | /api/caption   |
| external.service | replicate      | (per external span) |
| retry.count      | integer        |
| cache.hit        | boolean        |
| model.version    | e.g. BLIP@hash |
| user.licenseTier | trial          | premium             |

### Export

- Use OTLP HTTP exporter → aggregation backend (e.g., Honeycomb / Jaeger / AWS X-Ray bridge).

---

## Dashboards (Initial Panels)

1. **Request Latency** (p50, p95, p99 by endpoint).
2. **External API Performance** (latency & error rate per provider).
3. **Retry Behavior** (retries per 100 requests).
4. **Cache Efficiency** (hit ratio trend daily).
5. **Security Blocks** (prompt injections, WAF blocks, rate limit throttles).
6. **Frontend UX Metrics** (render times & first-caption latency).
7. **Error Distribution** (top error codes & affected endpoints).

---

## Alerting Strategy

| Alert                              | Condition                       | Severity | Action                                   |
| ---------------------------------- | ------------------------------- | -------- | ---------------------------------------- |
| High external API error rate       | >5% errors over 5m              | High     | Failover plan / provider status check    |
| Caption p95 latency spike          | p95 > 2x baseline for 10m       | High     | Investigate caching or provider slowness |
| Retry storm                        | Retries > 20% of external calls | Medium   | Adjust timeout / review provider health  |
| Cache hit ratio drop               | <20% sustained 30m              | Medium   | Inspect invalidation logic               |
| Prompt injection surge             | >50 blocks in 10m               | High     | Security review & anomaly analysis       |
| License verification failure spike | >60% invalid/hour               | Medium   | Check Gumroad API or abuse               |

---

## SLO / SLIs

| SLO                        | Target           | Measurement Window |
| -------------------------- | ---------------- | ------------------ |
| Caption p95 latency        | ≤ 1200ms         | 30 days            |
| Mask p95 latency           | ≤ 1500ms         | 30 days            |
| External call success rate | ≥ 98%            | 30 days            |
| Cache hit ratio            | ≥ 40% (Phase 4+) | 30 days            |
| Error budget (5xx)         | ≤ 1% of requests | 30 days            |
| Frontend first-caption p75 | ≤ 2200ms         | 30 days            |

---

## Instrumentation Plan

| Phase | Instrumentation Tasks                                                     |
| ----- | ------------------------------------------------------------------------- |
| 1     | Basic structured logging; requestId middleware; baseline metrics counters |
| 2     | Add histograms (latency); tracing spans for external calls; retry metrics |
| 3     | Frontend RUM beacon integration; security block metrics                   |
| 4     | Cache metrics + cache hit ratio panel; SLO dashboard rollout              |
| 5     | Worker tracing & advanced profiling triggers                              |

---

## Tooling & Libraries

| Concern | Library                         | Notes                                 |
| ------- | ------------------------------- | ------------------------------------- |
| Logging | pino                            | Fast JSON logging, supports redaction |
| Metrics | prom-client                     | Native Prometheus for Node            |
| Tracing | @opentelemetry/sdk-node         | Standard OTel implementation          |
| RUM     | Custom beacon + Performance API | Lightweight & privacy-aware           |

---

## Data Retention & Storage

| Data Type          | Retention                        | Rationale                    |
| ------------------ | -------------------------------- | ---------------------------- |
| Raw logs           | 14 days                          | Triage & short-term forensic |
| Aggregated metrics | 13 months                        | Trend & seasonal analysis    |
| Traces             | 7 days (full), 30 days (sampled) | Cost optimization            |
| RUM events         | 30 days (aggregated)             | UX tuning                    |

---

## Governance & Review

- Weekly: Review critical alert outcomes.
- Monthly: SLO compliance report.
- Quarterly: Instrumentation gaps & evolving KPIs.

---

## Acceptance Criteria Examples

- Logs: Random sample passes schema validation; includes `requestId` ≥ 99%.
- Metrics: Prometheus `/metrics` exposes defined counters/histograms with non-zero observations after traffic.
- Tracing: At least one end-to-end distributed trace visualizable per caption request.
- Dashboard: Panels load with no broken queries; baseline values appear.

---

## Open Questions

| Item                 | Question                    | Resolution Path                     |
| -------------------- | --------------------------- | ----------------------------------- |
| Long-term storage    | Need cold storage for logs? | Evaluate after 3 months volume      |
| Sampling strategy    | Dynamic based on load?      | Implement adaptive sampling Phase 4 |
| Multi-region tracing | If scaled?                  | Future ADR if multi-region planned  |

---

## Risks & Mitigations

| Risk                          | Mitigation                          |
| ----------------------------- | ----------------------------------- |
| Metric cardinality explosion  | Limit dynamic labels; review weekly |
| Log volume cost               | Implement sampling & compression    |
| Over-instrumentation overhead | Benchmark before & after phase 2    |

---

## Summary

This specification defines the foundational observability model enabling proactive performance management, cost optimization, and rapid incident response. It complements the architectural roadmap and security plan by embedding measurement into each phase of evolution.

End of Specification.
