## Contextual Captioner + Text Art — MVP (AWS Launch by Aug 10, 2025 IST)

Last updated: 2025-08-09 11:16:44Z

### One‑line

Upload an image, get smart caption suggestions, and place styled text that blends into the photo with a behind‑subject effect. Paywall‑gated exports.

---

### Scope (Day‑1)

- **Upload**: JPG/PNG.
- **Captions**: 3–5 suggestions using BLIP captioning + LLM rewrites.
- **Segmentation**: Subject mask for “text behind subject”.
- **Text art presets**: Neon, Magazine, Paint/Brush, Emboss.
- **Transform**: Manual drag/scale/rotate; optional auto placement into empty areas.
- **Export**: PNG/JPG (1080px max) with/without watermark.
- **Payments**: Gumroad license verification. Free tier: 2 watermarked exports.

---

### Tech Choices (AWS Architecture)

- **Frontend**: React SPA hosted on S3, served via CloudFront.
- **APIs**: API Gateway + Lambda functions:
  - `/caption`: Calls Replicate BLIP for base caption, then OpenAI for rewrites.
  - `/mask`: Calls Replicate `rembg` for foreground mask (alpha PNG).
  - `/verify`: Calls Gumroad Verify API for license validation.
- **Storage**: S3 bucket for temporary image uploads with 48‑hour lifecycle deletion.
- **Secrets**: AWS SSM Parameter Store for API keys and product permalink.
- **Security**: API Gateway usage plans/keys, AWS WAF rules, and Lambda reserved concurrency limits.

---

### Cost Guardrails

- **API Gateway throttling**: 10 req/sec, burst 20.
- **Lambda reserved concurrency**: cap at 5.
- **WAF**: block IPs with >100 requests in 5 minutes.
- **S3 lifecycle**: auto‑delete uploaded objects after 48 hours.
- **AWS Budgets**: alerts at ₹2k and ₹5k.

---

### Data Flow

1. Client requests pre‑signed S3 URL → uploads image directly to S3.
2. Client calls `/caption` (Lambda) with S3 object key → Lambda fetches image → BLIP caption → LLM rewrites → returns variants.
3. Client calls `/mask` with S3 object key → Lambda calls `rembg` (Replicate) → returns alpha mask URL.
4. User selects caption + preset and customizes text.
5. Canvas composites background image + text + subject mask so text appears behind the subject.
6. Client calls `/verify` with license → on success, exports without watermark; otherwise watermark and limit to 2/day (local tracking).

---

### Paywall Logic (Gumroad)

- Input field: License key stored locally (e.g., `localStorage`).
- `/verify` Lambda calls Gumroad Verify API and validates purchase is not refunded/chargebacked.
- On success: enable premium export.
- Free tier: 2 watermarked exports/day (local soft enforcement).

---

### Project Structure

```
caption-art/
├─ frontend/             # React UI (S3 + CloudFront)
├─ lambdas/              # AWS Lambda handlers
│  ├─ caption.js         # Calls Replicate BLIP + OpenAI rewrite
│  ├─ mask.js            # Calls Replicate rembg (alpha PNG)
│  └─ verify.js          # Calls Gumroad license verify
├─ cdk/                  # IaC (AWS CDK)
│  └─ stack.ts           # S3, CloudFront, API Gateway, Lambdas, WAF, Budgets
└─ README.md
```

---

### Environment Variables (stored in SSM Parameter Store)

- `REPLICATE_API_TOKEN=...`
- `OPENAI_API_KEY=...`
- `GUMROAD_PRODUCT_PERMALINK=clexp`
- `GUMROAD_ACCESS_TOKEN=...`

---

### Hour‑by‑Hour Plan (Aug 9 Evening → Aug 10 Launch)

1. Setup repo + React scaffold — 1.5h
2. Canvas editor + style presets — 1.5h
3. Lambda `/caption` — 2h
4. Lambda `/mask` — 1h
5. Lambda `/verify` — 0.5h
6. Pre‑signed S3 upload flow — 1h
7. AWS guardrails (throttling, WAF, budgets) — 1h
8. QA with sample images — 1h
9. Deploy frontend to S3/CloudFront — 0.5h

---

### Deployment Notes

- **Frontend**: Build React SPA and sync to S3. In CloudFront, set the S3 bucket as origin, enable compression, and configure default root object.
- **APIs**: Deploy Lambdas behind API Gateway with a stage (e.g., `prod`). Attach usage plan and API key if needed. Enable WAF web ACL.
- **Secrets**: Put tokens/keys in SSM Parameter Store (SecureString). Grant Lambdas `ssm:GetParameter` on those paths.
- **S3 uploads**: Provide a Lambda/API route for generating pre‑signed PUT URLs; enforce size/content‑type; apply a lifecycle rule to delete objects after 48 hours.
- **Budgets**: Create AWS Budgets alerts (email/SNS) for ₹2k and ₹5k monthly thresholds.

---

### Notes

- Heavy compute is offloaded to Replicate/OpenAI, keeping Lambdas lightweight and cost‑predictable.
- Cost protection via concurrency limits, API throttles, WAF, and Budgets.
- UX mirrors the Vercel version while retaining AWS control and guardrails.
