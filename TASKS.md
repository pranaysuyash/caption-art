# Caption Art — AWS MVP Task List

## Completed Tasks

- [x] Draft AWS README with architecture, data flow, guardrails, and plan
- [x] Scaffold frontend (Vite + React + TS)
- [x] Scaffold Lambda handlers: caption, mask, verify, presign
- [x] Scaffold CDK app and stack

## In Progress Tasks

- [ ] Implement canvas drag/scale/rotate controls
- [ ] Add watermarking logic client-side for free tier
- [ ] Build & wire CI pipeline (build lambdas, cdk synth, deploy)
- [ ] Integrate WAF ACL and usage plan in API Gateway

## Future Tasks

- [ ] Saliency-based auto placement suggestion
- [ ] Additional presets and curved text path
- [ ] Social share sizes (square, story, post)
- [ ] Switch to CloudFront Function for SPA routing if needed

## Relevant Files

- `frontend/src/App.tsx` — Canvas editor and API wiring
- `lambdas/src/caption.ts` — BLIP + OpenAI rewrites
- `lambdas/src/mask.ts` — rembg segmentation via Replicate
- `lambdas/src/verify.ts` — Gumroad license verification
- `lambdas/src/presign.ts` — S3 pre-signed PUT URLs
- `cdk/lib/stack.ts` — Infra: S3, CF, API GW, Lambdas, deploy
