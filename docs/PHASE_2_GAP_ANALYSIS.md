# Phase 2 Gap Analysis: Mock Services & Technical Debt

**Context:** Phase 2 features were implemented as API skeletons returning mock data to prove concepts quickly. These must be replaced with real AI service integrations for production.

## ❌ Mocked Services (Requires Implementation)

### 1. MultiFormatService
*   **Current State:** Returns placeholder/static image URLs.
*   **Required Implementation:** Integrate with real image generation/editing APIs (e.g., DALL-E 3, Stable Diffusion, or Replicate's resizing/inpainting models) to actually resize and regenerate assets for different aspect ratios (Square, Story, Landscape).

### 2. StyleSynthesisService
*   **Current State:** Returns fake style analysis objects.
*   **Required Implementation:** Build a real computer vision pipeline (likely using OpenAI Vision API or a dedicated CV model) to extract color palettes, composition, and typography styles from reference images.

### 3. CampaignTemplateService
*   **Current State:** Returns static JSON template mock data.
*   **Required Implementation:** Implement an AI-driven system that generates reusable templates based on high-performing past content and user prompts.

### 4. SimpleVideoRenderer
*   **Current State:** Returns fake video URLs.
*   **Required Implementation:** Integrate with a video generation/editing API (e.g., Runway, HeyGen, or FFmpeg on Lambda) to actully stitch together scenes, images, and scripts into video assets.

## ✅ Phase 1 (Production Ready)
*   **Variation Engine:** Real AI generation.
*   **Ad-Copy Mode:** Structured generation working.
*   **Campaign-Aware Prompting:** Functional.
*   **Video Script Generation:** Text generation is working (rendering is mocked).

## Development Tooling
*   **`server-simple.cjs`:** A lightweight, mock-heavy server for fast frontend iteration. **Do not deploy.**
*   **`server.ts`:** The production target. Use this for all final integration testing.
