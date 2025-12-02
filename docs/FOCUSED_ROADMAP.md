# Caption-Art Application - Focused Roadmap

## Overview

The caption-art application is currently a caption + text-art + brand-kit driven batch creative generator for agencies. The roadmap must stay focused on the core flow: agency → client → brand kit → assets → generate → approve → export, with gradual extension into campaigns and ad creatives.

## Current State (agency-jobflow-v1)

The live codebase supports:
- User auth
- Workspaces
- Brand kits (fonts, colors, voice prompt)
- Image uploads
- Caption generation
- Approval UI
- Export
- Job queue
- Batch processing

What's NOT yet implemented:
- No real "campaign" concept
- No ad-specific outputs
- No scheduling
- No client portal
- No analytics
- No multi-brand structures
- No ad-level copy (headlines, body, CTA)
- No structured TA/objective fields
- No style/reference ingestion

## Corrected Roadmap

### Stage 1 — Complete the Core Product (NOW)

Already underway.
- Fix export 404
- Fix approval shape consistency
- Complete render pipeline (mask + layout + font + watermark)
- Complete FE approval grid
- Complete export ZIP integration
- Stabilise test suite

This completes "Agency drops assets → 10–30 branded creatives".

### Stage 2 — Brand Kit v2 + Campaign System (NEXT)

This addresses the needs for agencies feeding creatives, palettes, and tone.

**Campaign model**
- name
- objective
- target audience
- CTA
- launch type
- notes
- placements

**Brand Kit v2**
- personality
- TA (target audience)
- preferred phrases
- forbidden phrases
- extracted palette from reference creatives
- extracted layout patterns (basic heuristic)

**Reference Creative Uploads**
→ as style reference (not to be captioned)
→ used to influence generation

This enables:
- new launches
- ad creatives
- recurring campaigns
- cross-client consistency
- "style matching"

### Stage 3 — Ad Creative Mode (Most Important for Agencies)

This transitions from "caption + image" → "ad creative builder".

**AI-generated:**
- Headline
- Sub-headline
- Body text
- CTA text
- Platform-length variations

**Output:**
- IG Feed (1:1)
- IG Story (9:16)
- LinkedIn (1.91:1)
- Facebook (1.91:1)
- Pinterest (2:3)

**Render engine upgrades:**
- grid layouts
- text blocks
- CTA button styles
- background shapes

This positions the product as "Canva for agencies — but automatic" which is where the revenue potential lies.

### Stage 4 — Template Memory + Style Learning (OPTIONAL)

- Save templates per client
- Auto-learn styles
- Reapply automatically
- Detect "brand compliance"

This becomes the differentiation: "Each client has a consistent aesthetic across campaigns."

### Stage 5 — Publishing + Collaboration (Only after PMF)

Only AFTER 10 paying agencies ask for:
- client review
- post scheduling
- analytics
- engagement metrics

## Focused Workflow Additions

Based on the corrected understanding, the relevant workflow additions are:

### 1. Campaign-based Workflow (High Priority)
- Implementation: New `/api/campaigns` routes and UI
- Features: 
  - Campaign creation with structured objective/TA/CTA fields
  - Association of assets and generated content to campaigns
  - Campaign-based organization and filtering
- Value: Core to moving from generic tool to agency workflow solution

### 2. Template/Preset/Style Library (High Priority)
- Implementation: Enhance brand kit system with reference style uploads
- Features:
  - Upload reference creatives for style guidance
  - Extract color palettes from reference images
  - Save and reuse design templates
  - Apply consistent styling across campaigns
- Value: Critical for agencies maintaining brand consistency

### 3. Content Repurposing & Format Adaptation (High Priority)
- Implementation: Extend render engine to support multiple aspect ratios/formats
- Features:
  - Generate feed, story, reel versions from single source
  - Adapt text length for different platforms
  - Platform-specific layout variations
- Value: Multiplies output value from single creative input

## Workflows to NOT Implement Now

These were identified as premature for PMF:
- Social media API integrations (high compliance cost)
- Client collaboration portals (overkill for v1)
- Team task assignment (unnecessary operations layer)
- Trend analysis and hashtag generation (noisy value)
- Scheduling and publishing (different product category)
- Competitor benchmarking (major overkill)

## Alignment Check

This roadmap directly addresses the key questions:
- Can the app accept existing creatives as reference? → YES, with Stage 2
- Can the app accept palettes? → YES, with Brand Kit v2
- Can the app accept tone/TA/campaign info? → YES, with structured Campaign model
- Can the app power ad creatives? → YES, with Stage 3 Ad Creative Mode

This focuses the development on the core value proposition that agencies need, rather than building a generic content platform.