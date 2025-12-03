# Caption Quality Improvements

## Overview

Enhanced caption generation with rich campaign and brand context for higher quality, more relevant captions.

## What Changed (Task 2 Complete)

### Enhanced Prompt Context

The LLM prompt now includes:

1. **Campaign Objective** - Optimizes caption for awareness/traffic/conversion/engagement
2. **Funnel Stage** - Adjusts messaging depth (awareness/consideration/decision)
3. **Target Audience** - Tailors language and tone to specific audience
4. **Brand Personality** - Injects brand voice characteristics
5. **Value Proposition** - Emphasizes core brand value
6. **Must Include Phrases** - Enforces required messaging
7. **Must Exclude Phrases** - Prevents forbidden terms
8. **Platform Context** - Adapts tone for IG/FB/LI

### Before vs After

**Before:**

```
"You are a professional social media caption writer.
Brand Voice: [generic voice prompt]
Create engaging captions."
```

**After:**

```
"You are a professional social media caption writer.

Brand Voice: [specific voice prompt]

Campaign Context:
- Primary Objective: conversion (optimize caption for this goal)
- Funnel Stage: decision (adjust messaging depth accordingly)
- Target Audience: fitness enthusiasts aged 25-40
- Brand Personality: energetic and motivational
- Value Proposition: science-backed fitness solutions

Required Constraints:
- MUST include: "30-day guarantee", "free shipping"
- MUST NOT include: "easy", "miracle"

Platform: ig-feed
- Use casual, visual-first language with emojis

Guidelines:
- Align with campaign objective and funnel stage
- Respect all required constraints
```

### Impact

- **Relevance**: Captions now match campaign goals (awareness vs conversion)
- **Consistency**: Brand personality and voice enforced across all captions
- **Compliance**: Must include/exclude phrases guaranteed
- **Platform-Specific**: Tone adapts to Instagram casual vs LinkedIn professional
- **Funnel-Aware**: Messaging depth matches customer journey stage

## Technical Implementation

### Files Modified

1. **`backend/src/services/captionGenerator.ts`**

   - Extended `GenerationRequest` interface with campaign fields
   - Enhanced `generateCaption()` to build context-rich prompts
   - Updated `processBatchJob()` to pass campaign data

2. **`backend/src/services/CreativeEngine.ts`**
   - Replaced template-based `generateAdCopy()` with AI-powered generation
   - Added `selectCTA()` for objective-aware CTAs
   - Added `generateFallbackCopy()` for graceful degradation

### API Flow

```
AssetManager (Frontend)
  ↓
POST /api/creative-engine/generate
  ↓
CreativeEngine.generateCreatives()
  ↓ (with campaign context)
CaptionGenerator.generateCaption()
  ↓ (enhanced prompt with 8 context fields)
OpenAI GPT-3.5
  ↓
High-quality, context-aware caption
```

## Next Steps (Week 1-2)

**Task 3: Variation Engine**

- Generate N caption options per asset (1-10 configurable)
- Each variant uses different angle: emotional, data-driven, question-based, CTA-focused
- Frontend approval grid shows all variants side-by-side

**Week 1 Goal:** Complete Task 3 to give agencies multiple caption options per asset
