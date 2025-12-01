# Security Review Supplement

Last Updated: 2025-12-01
Status: Draft
Related Docs: TECHNICAL_DEBT_REGISTER.md, ARCHITECTURE_IMPROVEMENT_PLAN.md

## Scope
Expands on previously identified security items with concrete policy proposals and mitigation tactics for backend, frontend, and infrastructure.

## Threat Model (High-Level)
| Vector | Description | Potential Impact | Mitigation Priority |
|--------|-------------|------------------|---------------------|
| Prompt Injection | Malicious keywords altering AI output behavior | Undesired / harmful output; increased token usage cost | High |
| Excessive API Abuse | Overuse of expensive endpoints (caption/mask) | Cost escalation, degraded performance | High |
| CORS Misconfiguration | Incorrect origin/credential settings | Data exposure or broken auth flows | High |
| Broad IAM Permissions | Overly permissive SSM access | Lateral movement / secret enumeration | High |
| Large Payload Uploads | Oversized base64 images | Memory pressure, denial of service | Medium |
| License Validation Spoofing | Client-side license assumptions | Lost revenue features | Medium |
| Lack of Audit Logging | Missing forensic trail | Hard incident reconstruction | Medium |
| Unencrypted Sensitive Data in Logs | Secrets appearing in error stacks | Credential leakage | Medium |
| No Input Sanitization for Text | Control characters or injection sequences | Broken rendering / output corruption | Medium |

---
## Backend Security Enhancements
### 1. Prompt & Keyword Sanitization
- Enforce keyword constraints: max 10 items, each 1–32 chars.
- Allowed charset regex: `/^[A-Za-z0-9\-_' ]+$/`.
- Strip or escape newline, tab, control characters.
- Maintain rejection counter metric `prompt_injection_blocked_total`.

### 2. Validation Unification
- All request bodies validated via central Zod schemas.
- Add meta tags per schema: `{ security: { rateWeight: number } }` for dynamic rate limiting.

### 3. Sensitive Error Redaction
- Replace direct `Error.message` for external API errors with generic messages.
- Keep detailed cause in structured log (internal only) with `sensitivity: external-api` tag.

### 4. Structured Rate Limiting
Proposed tiers (initial baseline):
| Endpoint | Window | Max | Cost Weight | Notes |
|----------|--------|-----|-------------|-------|
| /api/health | 60s | 300 | 0.1 | Low cost |
| /api/caption | 300s | 30 | 5 | High external cost |
| /api/mask | 300s | 30 | 5 | High external cost |
| /api/story/next-frame | 300s | 15 | 6 | Combined complexity |
| /api/verify | 300s | 60 | 1 | Moderate |

Dynamic aggregate cost threshold: block if sum(costWeight * requestsInWindow) exceeds budget.

### 5. Input Size Enforcement
- Pre-validate base64 image length (< ~8MB encoded) and reject with 413 if exceeded.
- Optional decoding header to verify MIME type early.

### 6. License Enforcement Logic
- Backend verifies license per session; attaches signed token with expiry.
- Frontend watermark and premium feature gates rely on token claims.
- Token format: JWT with `features: ["premium"]` or `trial` and short TTL (e.g., 6h).

### 7. Anti-Automation & Abuse Detection
- Track rapid-fire identical image hash requests; if >N within short window from same IP/user, apply cooldown.
- Introduce lightweight behavioral risk score (e.g., repeated 400 errors + high throughput).

### 8. Correlation IDs & Security Context
- Generate `x-request-id` if absent; propagate.
- Set `securityContext` object in request (IP, user agent hash, license state, rate usage snapshot) for logs.

### 9. Cache Poisoning Prevention
- Caption/mask caching key includes: `modelVersion + sanitizedPromptHash + imageHash`.
- On model update, bump `modelVersion` to invalidate stale results.

---
## Frontend Security Enhancements
### 1. Sanitized Display of Captions
- Escape `<`, `>`, `&` before rendering any AI-generated variant.
- Optional user toggle to show raw vs sanitized output for advanced users.

### 2. Restrict Local Font Uploads
- Accept only recognized MIME types; enforce size limit (e.g., < 2MB).
- Use object revocation + memory clean-up after selection.

### 3. Clipboard Operations
- Wrap clipboard writes in try/catch; log sanitized event for auditing.

### 4. Watermark Enforcement
- If license claim absent, ensure forced watermark flag at export layer.

### 5. CSRF Consideration
- API currently stateless JSON; if cookies added later, adopt same-site / CSRF token strategy.

### 6. Keyboard Shortcut Safety
- Prevent shortcuts in scenarios where privileged operations could trigger unsafely (e.g., export on hidden canvas state).

---
## Infrastructure / DevOps Security Enhancements
### 1. IAM Scope Reduction
- Replace wildcard SSM policy with explicit ARNs: `arn:aws:ssm:region:account:parameter/caption-art/*`.
- Add policy linting CI check.

### 2. Secret Rotation Policy
- For OpenAI & Replicate tokens: rotate every 90 days; store rotation metadata tag.

### 3. WAF Rules (If ARN Provided)
Baseline managed rule groups:
- AWSManagedRulesCommonRuleSet
- AWSManagedRulesKnownBadInputsRuleSet
- AWSManagedRulesSQLiRuleSet
Custom rule additions:
- Rate-based rule on `/api/caption` high-frequency anomaly.

### 4. Logging Hygiene
- Filter logs for patterns resembling secrets (regex for API keys). Obfuscate before output.

### 5. Deployment Guardrails
- Pre-deploy script verifying presence/validity of required parameters.
- Fail-fast if WAF ARN invalid.

### 6. S3 Bucket Policies
- Confirm private buckets have explicit PublicAccessBlock + deny `Principal="*"` unintended grants.
- Add object ownership enforcement.

### 7. CloudWatch Alarms
| Alarm | Threshold | Action |
|-------|-----------|--------|
| External API 5xx | > 5/min | Pager notification |
| Throttled Requests | > 20/min | Rate config review |
| Large Payload Rejections | > 10/min | Investigate abuse |
| License Validation Fail % | > 60% per hour | Check Gumroad API / potential misuse |

### 8. Artifact Integrity
- Hash Lambda build bundles; verify checksum pre-deploy.

---
## Data Handling & Privacy
- PII: Gumroad email → store transiently only for session; mask in logs as `u***@domain.com`.
- Retention: AI generation inputs not stored beyond caching TTL unless user saves project explicitly.
- Redaction: On error stack traces, exclude request bodies containing base64 image data.

---
## Policy Additions
### Prompt Hygiene Policy
1. Reject keywords with control Unicode categories Cc, Cf.
2. Collapse repeated whitespace; trim ends.
3. Enforce combined prompt (base + keywords) length < 512 chars after sanitization.
4. Log sanitized vs raw diff for audit sampling.

### Rate Governance Policy
- Weekly review of top IP/user throughput.
- Adjust cost weights quarterly based on provider pricing shifts.

### Secret Exposure Prevention
- CI secret scanning (git-secrets / trufflehog).
- Runtime detection: regex patterns in log pipeline → automatic redaction.

---
## Implementation Sequencing
| Phase | Security Tasks |
|-------|----------------|
| 1 | Keyword sanitization, CORS allowlist, IAM narrowing |
| 2 | Structured logging with secret redaction, PII masking, rate tiers |
| 3 | License token issuance, watermark enforcement, prompt length gating |
| 4 | Caching with version keys, anti-abuse heuristics |
| 5 | Worker queue security contexts, SSE auth (if added) |

---
## Metrics & KPIs
| Metric | Baseline Needed | Target |
|--------|-----------------|--------|
| Prompt injection rejected (%) | 0 | Establish <2% legitimate rejection |
| Secrets found in logs | Unknown | 0 occurrences post Phase 2 |
| Avg caption latency (p95) | Collect | ≤ 1.2x pre-sanitization baseline |
| License watermark bypass attempts | 0 baseline | Detected & blocked 100% |
| Invalid payload rejections | Collect | < 5% of total requests |

---
## Acceptance Criteria Examples
- Sanitization: Test suite includes malicious keyword cases; all return 400 with structured error.
- IAM Narrowing: Policy diff shows reduction to ≤ expected parameter ARNs only.
- CORS: Preflight success logs for all allowlisted domains; rejection for others.
- PII Masking: Log sample demonstrates masked emails, not raw.

---
## Open Questions
| Question | Consideration | Resolution Path |
|----------|---------------|-----------------|
| Do we need auth layer now? | Currently license-only gating | Evaluate user accounts Q2 2026 |
| Worker security context? | Pending worker introduction | Define in Worker ADR |
| SSE or WebSocket first? | SSE simpler; WebSocket for bi-directional | Start with SSE Phase 4 |

---
## References
- OWASP REST Security Guidelines
- OpenAI Prompt Injection Mitigation Guidelines
- AWS Well-Architected Security Pillar

---
## Summary
This supplement establishes a phased security hardening approach balancing immediate high-value safeguards (sanitization, IAM narrowing) with longer-term strategic protections (worker isolation, cache versioning). It aligns directly with the broader improvement roadmap while avoiding unnecessary complexity premature to current scale.

End of Supplement.
