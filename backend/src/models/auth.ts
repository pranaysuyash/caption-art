import bcrypt from 'bcrypt'
import { log } from '../middleware/logger'

import { Workspace } from './Workspace'
export { Workspace }
import { WorkspaceModel } from './Workspace'

export interface User {
  id: string
  email: string
  agencyId: string
  createdAt: Date
  lastLoginAt: Date
}

export interface Agency {
  id: string
  licenseKey?: string // From Gumroad/LemonSqueezy
  billingActive: boolean
  planType: 'free' | 'paid'
  createdAt: Date
}

import { Asset } from './Asset'
export { Asset }
import { AssetModel } from './Asset'
import { BatchJob } from './BatchJob'
export { BatchJob }
import { BatchJobModel } from './BatchJob'

export interface BrandKit {
  id: string
  workspaceId: string // Belongs to workspace, not agency
  colors: {
    primary: string
    secondary: string
    tertiary: string
  }
  fonts: {
    heading: string
    body: string
  }
  logo?: {
    url: string
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }

  // Existing fields
  voicePrompt: string // AI caption tone instruction
  maskingModel?:
    | 'rembg-replicate'
    | 'sam3'
    | 'rf-detr'
    | 'roboflow'
    | 'hf-model-id'

  // BrandKit v2 - Campaign Brain fields
  brandPersonality?: string // "Bold, witty, slightly irreverent"
  targetAudience?: string // "Working moms 28-40 in Tier 1 cities"
  valueProposition?: string // "Saves 2 hours a day on X"
  forbiddenPhrases?: string[] // "Do not say 'cheap', 'discount'"
  preferredPhrases?: string[] // "Always call our users 'creators'"
  toneStyle?:
    | 'professional'
    | 'playful'
    | 'bold'
    | 'minimal'
    | 'luxury'
    | 'edgy'

  // Extended fields for CampaignAwareService
  uniqueValue?: string
  keywords?: string[]
  name?: string
  values?: string[]
  toneOfVoice?: string
  keyDifferentiators?: string[]
  imageryStyle?: string

  createdAt: Date
  updatedAt: Date
}

import { Caption, CaptionVariation, AdCopyContent } from './Caption'
// Export caption interfaces
export { Caption, CaptionVariation, AdCopyContent } from './Caption'
export * from './Video'
import { CaptionModel } from './Caption'

// Extended Video Rendering Interfaces for Phase 2.4

export interface VideoScene {
  sceneNumber: number
  type: 'hook' | 'problem' | 'benefit' | 'demo' | 'cta'
  duration: number // in seconds
  description: string
  visualDescription?: string
  script: string
  visualNotes?: string
  voiceover?: string
  tone?:
    | 'neutral'
    | 'energetic'
    | 'dramatic'
    | 'warm'
    | 'professional'
    | 'playful'
  transition?: VideoTransitions
}

export interface VideoTransitions {
  type: 'fade' | 'slide' | 'dissolve' | 'cut' | 'zoom'
  duration: number // in seconds
  direction?: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down'
}

export interface VideoAudioSpec {
  type: 'voiceover' | 'background' | 'music' | 'effects'
  volume: number // 0-1
  fadeIn?: number // in seconds
  fadeOut?: number // in seconds
}

export type VideoRenderFormat = 'square' | 'landscape' | 'portrait' | 'stories'
export type VideoRenderQuality = 'low' | 'medium' | 'high'

export interface VideoRenderSpec {
  format: VideoRenderFormat
  quality: VideoRenderQuality
  resolution?: string // e.g., '1080p', '4K'
}

export interface VideoRenderRequest {
  duration: number // in seconds
  format: VideoRenderFormat
  quality: VideoRenderQuality
  platform: string
  tone: string
  customStyle?: {
    visualStyle: string
    colorScheme: string
    compositionStyle?: string
    transitionStyle?: string
  }
  includeAudio: boolean
  customInstructions?: string
  spec: VideoRenderSpec
}

export interface VideoRenderResult {
  success: boolean
  videoUrl: string
  metadata: {
    duration: number
    format: VideoRenderFormat
    quality: VideoRenderQuality
    scenes: number
    size: string
    processingTime: number
    hasAudio: boolean
    platform: string
  }
  assets: {
    storyboard: VideoStoryboard
    script: VideoScript
    renderedScenes: number
  }
  quality: {
    visualQuality: number
    audioQuality?: number
    renderScore: number
    technicalMetrics: any
  }
  recommendations: string[]
}

export interface VideoScriptGenerationRequest {
  duration: number
  format: VideoRenderFormat
  platform: string
  tone: string
  includeStoryboard: boolean
  customInstructions?: string
}

export interface VideoScript {
  scenes: VideoScene[]
  totalDuration: number
  estimatedDuration?: number
  hook?: string
  callToAction?: string
  platform: string
  tone?: string
}

export interface VideoStoryboard {
  scenes: {
    sceneNumber: number
    description: string
    visualDescription: string
    duration: number
    imageUrl: string
    shotType: string
    composition: string
    lighting: string
    colorPalette: string[]
    elements: string[]
  }[]
  totalDuration: number
  aspectRatio: string
  style: {
    visualStyle: string
    colorScheme: string
    pacing: string
    transitionStyle: string
  }
  notes: string
}

// Phase 2: Multi-Format Static Outputs + Reference Style Synthesis
export interface MultiFormatOutput {
  id: string
  sourceAssetId: string
  workspaceId: string
  formats: {
    square: {
      url: string
      thumbnailUrl: string
      dimensions: { width: 1080; height: 1080 }
      platform: 'instagram-feed' | 'facebook-feed' | 'linkedin'
    }
    story: {
      url: string
      thumbnailUrl: string
      dimensions: { width: 1080; height: 1920 }
      platform: 'instagram-story' | 'facebook-story' | 'tiktok'
    }
    landscape: {
      url: string
      thumbnailUrl: string
      dimensions: { width: 1920; height: 1080 }
      platform: 'youtube-thumbnail' | 'facebook-banner' | 'linkedin-banner'
    }
  }
  captionVariationId?: string
  qualityMetrics: {
    brandConsistency: number
    visualAppeal: number
    textReadability: number
    overallScore: number
  }
  generatedAt: Date
}

export interface StyleReference {
  id: string
  workspaceId: string
  name: string
  description: string
  referenceImages: string[] // URLs to reference images
  extractedStyles: {
    colorPalette: {
      primary: string[]
      secondary: string[]
      accent: string[]
    }
    typography: {
      fonts: string[]
      weights: ('light' | 'regular' | 'medium' | 'bold' | 'black')[]
      sizes: string[]
    }
    composition: {
      layout:
        | 'centered'
        | 'rule-of-thirds'
        | 'asymmetrical'
        | 'minimal'
        | 'dense'
      spacing: 'tight' | 'normal' | 'loose'
      balance: 'symmetrical' | 'asymmetrical'
    }
    visualElements: {
      gradients: boolean
      shadows: boolean
      borders: boolean
      patterns: boolean
      illustration: boolean
      photography: boolean
    }
  }
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
}

export interface StyleSynthesisRequest {
  workspaceId: string
  sourceAssetId: string
  styleReferences: string[] // Style reference IDs to blend
  synthesisMode: 'dominant' | 'balanced' | 'creative' | 'conservative'
  targetPlatforms: ('instagram' | 'facebook' | 'linkedin' | 'tiktok')[]
  outputFormats: ('square' | 'story' | 'landscape')[]
  brandKitId?: string // Optional brand kit for brand consistency
}

export interface CampaignTemplate {
  id: string
  name: string
  category:
    | 'product-launch'
    | 'brand-awareness'
    | 'lead-generation'
    | 'event-promotion'
    | 'sale'
    | 'content-series'
  description: string
  industry?: string // Tech, Fashion, Food, etc.
  workspaceId: string
  isActive: boolean
  tags: string[]
  targetPlatforms: string[]
  targetAudience: {
    demographics: {
      ageRange: string
      gender: string
      location: string
      income: string
      segments?: string[] // e.g. ["Young professionals", "Urban dwellers"]
      lifestage?: string[] // e.g. ["New parents", "First-job"]
    }
    interests: string[]
    psychographics?: string[]
    behaviors?: string[]
    painPoints: string[]
    motivations?: string[]
    mediaTouchpoints?: string[]
    postingFrequency?: {
      platform: string
      cadence: string
      rationale?: string
    }[]
    brandVoice?: {
      tone?: string[]
      personality?: string[]
      dos?: string[]
      donts?: string[]
      vocabulary?: string[]
    }
    buyerJourneyStages?: string[]
  }
  contentStructure: {
    phases: {
      hook: string
      body: string
      cta: string
    }
    contentTypes: string[]
  }
  messagingGuidelines: string[]
  visualGuidelines: string[]
  platformOptimizations: Record<
    string,
    {
      tone: string
      characterLimits: {
        headline: number
        body: number
        cta: number
        primaryText: number
      }
      bestPractices: string[]
      adjustments: Record<string, string>
    }
  >
  successMetrics: string[]
  templateStructure: {
    contentTypes: ('image' | 'carousel' | 'story' | 'video')[]
    captionPatterns: {
      hook: string[] // Opening line patterns
      body: string[] // Main content patterns
      cta: string[] // Call-to-action patterns
      hashtags: string[] // Hashtag strategies
    }
    visualStyle: {
      colorStrategy: 'brand-colors' | 'trend-colors' | 'monochrome' | 'gradient'
      layoutPattern: 'grid' | 'diagonal' | 'radial' | 'minimal'
      textTreatment: 'bold-headlines' | 'elegant-copy' | 'minimal-text'
    }
    suggestedAssets: {
      types: ('product' | 'lifestyle' | 'behind-scenes' | 'user-generated')[]
      layouts: (
        | 'product-focused'
        | 'lifestyle-integrated'
        | 'brand-heavy'
        | 'text-heavy'
      )[]
    }
  }
  placeholderVariables: {
    [key: string]: {
      type: 'text' | 'image' | 'color' | 'number'
      description: string
      example: string
      required: boolean
    }
  }
  usageStats: {
    timesUsed: number
    successRate: number
    avgEngagement: number
    lastUsed?: Date
  }
  isPremium: boolean // Premium templates require higher tier
  createdAt: Date
  updatedAt: Date
}

export interface CampaignTemplateInstance {
  id: string
  templateId: string
  workspaceId: string
  campaignId?: string
  name: string
  filledVariables: {
    [key: string]: string | string[] | boolean | number
  }
  customizations: {
    brandKitId?: string
    colorOverrides?: {
      primary?: string
      secondary?: string
      accent?: string
    }
    layoutModifications?: {
      spacing?: 'tight' | 'normal' | 'loose'
      textAlignment?: 'left' | 'center' | 'right'
      logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    }
  }
  generatedContent: {
    captions: string[]
    imagePrompts: string[]
    storyboard?: any
  }
  status: 'draft' | 'generating' | 'completed' | 'failed'
  generatedAt?: Date
  createdAt: Date
}

export interface ExportJob {
  id: string
  workspaceId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  assetCount: number
  captionCount: number
  generatedAssetCount: number
  zipFilePath?: string
  errorMessage?: string
  createdAt: Date
  completedAt?: Date
}

// Template Memory System for Stage 4 - Template Memory & Style Learning
export interface Template {
  id: string
  name: string
  workspaceId: string
  campaignId?: string
  brandKitId?: string
  // Template components
  captionStructure: {
    toneStyle: string
    lengthPreferences: {
      min: number
      max: number
      ideal: number
    }
    wordChoicePatterns: string[]
    emotionalAppeal: string
  }
  layoutPreferences: {
    format: ('instagram-square' | 'instagram-story')[]
    layout: ('center-focus' | 'bottom-text' | 'top-text')[]
    textPositioning: string
  }
  performanceMetrics: {
    engagementRate?: number
    approvalRate: number
    reuseCount: number
    averageScore: number
  }
  createdAt: Date
  lastUsedAt?: Date
}

export interface StyleProfile {
  id: string
  name: string
  workspaceId: string
  campaignId?: string
  learnedFromCreativeId: string
  // Visual style elements
  colors: {
    primaryPalette: string[] // Top 5 colors
    secondaryPalette: string[]
    accentColors: string[]
    contrastPreferences: 'high' | 'medium' | 'low'
  }
  typography: {
    fontHierarchy: {
      headings: string[]
      body: string[]
      accents: string[]
    }
    spacingPreferences: {
      lineSpacing: number
      paragraphSpacing: number
      marginPaddingRatios: number
    }
  }
  layout: {
    compositionStyle: 'symmetrical' | 'asymmetrical' | 'grid-based' | 'freeform'
    elementHierarchy:
      | 'text-over-image'
      | 'image-over-text'
      | 'side-by-side'
      | 'layered'
    whiteSpaceUsage: 'minimal' | 'balanced' | 'generous'
  }
  brandAlignment: {
    personalityMatch: number // 0-1
    valuePropositionIncorporation: number // 0-1
    targetAudienceResonance: number // 0-1
  }
  createdAt: Date
  lastAppliedAt?: Date
}

// Campaign Management v2
export interface Campaign {
  id: string
  workspaceId: string
  brandKitId: string
  name: string
  description?: string

  // Campaign objective and context
  objective?: 'awareness' | 'traffic' | 'conversion' | 'engagement'
  launchType?: 'new-launch' | 'evergreen' | 'seasonal' | 'sale' | 'event'
  funnelStage?: 'cold' | 'warm' | 'hot'

  // Campaign Brief v2 - Strategic Brief Elements
  brief?: {
    // Client Context
    clientOverview?: string // "E-commerce fashion brand targeting millennials"
    campaignPurpose?: string // "Launch new summer collection and drive sales"

    // Business Goals
    primaryKPI?: string // "15% increase in online sales"
    secondaryKPIs?: string[] // ["20% traffic increase", "10% conversion rate improvement"]
    targetMetrics?: {
      impressions?: number
      reach?: number
      engagement?: number
      conversions?: number
      roi?: number
    }

    // Competitive Analysis
    competitorInsights?: string[] // ["Competitor A focuses on price points", "Competitor B emphasizes sustainability"]
    differentiators?: string[] // ["Premium quality", "Ethical sourcing", "Unique designs"]

    // Target Audience Deep Dive
    primaryAudience?: {
      demographics?: string | string[] // e.g. "Women 25-35, urban, HHI $60k+" or ["Women 25-35", "Urban", "$60k+ HHI"]
      psychographics?: string | string[] // e.g. "Fashion-conscious, value sustainability" or ["Fashion-conscious", "Sustainability-first"]
      painPoints?: string[] // ["Finding affordable trendy clothes", "Sustainable fashion options"]
      motivations?: string[] // ["Self-expression", "Environmental consciousness", "Social status"]
      mediaTouchpoints?: string[] // ["IG Stories", "TikTok For You", "LinkedIn feed"]
      postingCadence?: string // "3x/week IG feed, daily Stories"
      brandVoice?: string // "Bold, witty, plain-language; avoid jargon"
      journeyStages?: string[] // ["Awareness", "Consideration"]
    }

    // Message Hierarchy
    keyMessage?: string // "Premium sustainable fashion for conscious consumers"
    supportingPoints?: string[] // ["Ethically sourced materials", "Timeless designs", "Fair trade pricing"]
    emotionalAppeal?: string // "Empowerment through conscious fashion choices"
    socialProof?: string[] // ["Featured in Vogue", "5-star reviews"]
    keywords?: string[]
    tone?: string[]
    style?: string[]
    avoidWords?: string[] // Alias for mandatoryExclusions in some contexts

    // Mandatories & Constraints
    mandatoryInclusions?: string[] // ["Brand logo visible", "Price point mentioned", "Sustainability message"]
    mandatoryExclusions?: string[] // ["No stock photos", "No competitor comparisons", "No price focus"]
    legalRequirements?: string[] // ["Copyright notice", "Fair trade certification", "Model releases"]

    // Media & Platform Strategy
    platformSpecific?: {
      instagram?: string // "Focus on lifestyle imagery, influencer partnerships"
      facebook?: string // "Detailed product shots, customer testimonials"
      linkedin?: string // "Brand story, company values, sustainability initiatives"
    }

    // Timeline & Seasonality
    campaignDuration?: string // "8-week campaign with phased rollout"
    seasonality?: string // "Summer launch, aligning with vacation season"
    urgency?: string // "Limited edition collection, early bird pricing"
  }

  // Offer and CTA
  primaryOffer?: string // "Flat 20% off", "New summer collection"
  primaryCTA?: string // "Shop now", "Sign up", "Learn more"
  callToAction?: string // Prisma name for primary CTA field
  secondaryCTA?: string

  // Targeting and placement
  targetAudience?: string // More specific TA for this campaign
  placements?: ('ig-feed' | 'ig-story' | 'fb-feed' | 'fb-story' | 'li-feed')[]

  // Creative constraints
  headlineMaxLength?: number
  bodyMaxLength?: number
  mustIncludePhrases?: string[]
  mustExcludePhrases?: string[]

  // Quality and scoring
  qualityScore?: number
  scoreBreakdown?: Record<string, number>

  // Reference style for caption generation
  referenceCaptions?: string[] // Example captions to learn style from
  learnedStyleProfile?: string // JSON string of StyleProfile from styleAnalyzer

  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: Date
  updatedAt: Date
  briefData?: any
}

export interface ReferenceCreative {
  id: string
  workspaceId: string
  campaignId?: string
  name: string
  notes?: string // "We love the headline placement and color blocking here"
  imageUrl: string
  thumbnailUrl: string

  // Extracted style information
  extractedColors?: string[]
  detectedLayout?: 'center-focus' | 'bottom-text' | 'top-text' | 'split'
  textDensity?: 'minimal' | 'moderate' | 'heavy'

  // Style analysis results
  styleTags?: string[] // ['high-contrast', 'bold-typography', 'minimal']

  createdAt: Date
}

export interface GeneratedAsset {
  id: string
  jobId: string
  sourceAssetId: string
  workspaceId: string
  captionId?: string
  campaignId?: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedAt?: Date
  rejectedAt?: Date
  format: string
  layout: string
  caption: string
  imageUrl: string
  thumbnailUrl: string
  watermark: boolean
  createdAt: Date
}

export interface AdCreative extends GeneratedAsset {
  // Campaign-specific fields
  campaignId?: string
  placement: 'ig-feed' | 'ig-story' | 'fb-feed' | 'fb-story' | 'li-feed'
  primaryPlatform?: string // Added for compatibility
  slots?: any[] // Added for compatibility
  brandKitId?: string // Added for compatibility

  // Slot-based content (ad structure)
  headline: string
  subheadline?: string
  bodyText: string
  ctaText: string

  // Ad-specific metadata
  objective?: 'awareness' | 'traffic' | 'conversion' | 'engagement'
  offerText?: string

  // Performance tracking
  impressions?: number
  clicks?: number
  conversions?: number
  spend?: number

  // Quality scoring
  qualityScore?: number
  scoreBreakdown?: {
    brandVoiceMatch: number
    objectiveAlignment: number
    lengthCompliance: number
    constraintCompliance: number
  }
}

// In-memory storage for v1 (replace with database later)
// users and agencies moved to SQLite
// workspaces moved to Workspace.ts - use WorkspaceModel functions
// In-memory storage for v1 (replace with database later)
// users and agencies moved to SQLite (Prisma)
// workspaces moved to Workspace.ts - use WorkspaceModel functions
const brandKits = new Map<string, BrandKit>()
// assets moved to Asset.ts - use AssetModel functions
// captions moved to Caption.ts - use CaptionModel functions
// batchJobs moved to BatchJob.ts - use BatchJobModel functions
const generatedAssets = new Map<string, GeneratedAsset>()
const exportJobs = new Map<string, ExportJob>()

// Campaign Management v2 storage
const campaigns = new Map<string, Campaign>()
const referenceCreatives = new Map<string, ReferenceCreative>()
const adCreatives = new Map<string, AdCreative>()

// Template Memory & Style Learning System (Stage 4)
const templates = new Map<string, Template>()
const styleProfiles = new Map<string, StyleProfile>()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export class AuthModel {
  private static saltRounds = 12

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds)
  }

  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static async createUser(
    email: string,
    password: string,
    agencyName: string
  ): Promise<{ user: User; agency: Agency }> {
    const hashedPassword = await this.hashPassword(password)

    // Transaction to create agency and user together
    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          billingActive: false,
          planType: 'free',
        },
      })

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          agencyId: agency.id,
        },
      })

      return { user, agency }
    })

    return {
      user: {
        ...result.user,
        createdAt: result.user.createdAt,
        lastLoginAt: result.user.lastLoginAt,
      },
      agency: {
        ...result.agency,
        createdAt: result.agency.createdAt,
        planType: result.agency.planType as 'free' | 'paid',
      },
    }
  }

  static async findUserByEmail(email: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    if (!user) return undefined
    return {
      ...user,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }
  }

  static async getUserById(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    if (!user) return undefined
    return {
      ...user,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }
  }

  static async getAgencyById(id: string): Promise<Agency | undefined> {
    const agency = await prisma.agency.findUnique({
      where: { id },
    })
    if (!agency) return undefined
    return {
      ...agency,
      createdAt: agency.createdAt,
      planType: agency.planType as 'free' | 'paid',
    }
  }

  static async updateUserLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    })
  }

  static async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany()
    return users.map((u) => ({
      ...u,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }))
  }

  static async getAllAgencies(): Promise<Agency[]> {
    const agencies = await prisma.agency.findMany()
    return agencies.map((a) => ({
      ...a,
      createdAt: a.createdAt,
      planType: a.planType as 'free' | 'paid',
    }))
  }

  // Brand Kit methods (Still in-memory for now, to be migrated next)
  static async createBrandKit(
    brandKitData: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BrandKit> {
    const id = `bk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const brandKit: BrandKit = {
      id,
      ...brandKitData,
      createdAt: now,
      updatedAt: now,
    }
    brandKits.set(brandKit.workspaceId, brandKit)
    return brandKit
  }

  static async getBrandKit(workspaceId: string): Promise<BrandKit | undefined> {
    return brandKits.get(workspaceId)
  }

  static async updateBrandKit(
    workspaceId: string,
    updates: Partial<BrandKit>
  ): Promise<BrandKit | undefined> {
    const existing = brandKits.get(workspaceId)
    if (!existing) return undefined

    const updated: BrandKit = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }
    brandKits.set(workspaceId, updated)
    return updated
  }

  static deleteBrandKitsByWorkspace(workspaceId: string): number {
    return brandKits.delete(workspaceId) ? 1 : 0
  }

  // Seed an in-memory test user/workspace so README credentials work locally
  static ensureTestUser(): void {
    const email = process.env.DEFAULT_TEST_EMAIL || 'test@example.com'
    const password = process.env.DEFAULT_TEST_PASSWORD || 'testpassword123'
    const agencyName = process.env.DEFAULT_TEST_AGENCY || 'Test Creative Agency'

    this.findUserByEmail(email)
      .then(async (existing) => {
        if (existing) return
        const { agency, user } = await this.createUser(
          email,
          password,
          agencyName
        )
        try {
          await WorkspaceModel.createWorkspace(
            agency.id,
            'Demo Workspace',
            'General'
          )
        } catch (err) {
          log.warn({ err }, 'Failed to create demo workspace for test user')
        }
        log.info(
          { email, agency: agency.id, user: user.id },
          'Seeded default test user for local login'
        )
      })
      .catch((err) => {
        log.warn({ err }, 'Failed to seed default test user')
      })
  }

  // ... (Keep other methods like getBrandKit, etc. if they were there, or implement them)
  // Since I am replacing the whole class, I need to make sure I didn't miss anything.
  // The previous file had methods for BrandKits, Campaigns, etc. which were using Maps.
  // I should preserve those Map-based methods for now until I migrate them too.
  // I will copy the Map-based methods from the previous file content I viewed.

  // Actually, I should probably migrate BrandKit too since it's in the schema?
  // The user said "refactor and improve anything".
  // The schema has BrandKit, Campaign, etc.
  // I should try to migrate as much as possible, but maybe start with AuthModel (Users/Agencies) first to be safe,
  // and keep the others as Maps for this step, then do a second pass.
  // The prompt above only implements User/Agency in Prisma.
  // I will keep the Map implementations for BrandKit, etc. for now to avoid breaking too much at once.

  // Re-implementing the Map getters/setters for the other entities:

  // ... (Campaign methods)

  static computeCampaignQuality(campaignId: string): {
    qualityScore: number
    scoreBreakdown: Record<string, number>
  } {
    const captionsForCampaign = this.getCaptionsByCampaign(campaignId)
    const scores: number[] = []
    const breakdown: Record<string, number[]> = {}

    for (const caption of captionsForCampaign) {
      if (caption.qualityScore !== undefined) {
        scores.push(caption.qualityScore)
      }
      for (const variation of caption.variations) {
        if (variation.qualityScore !== undefined) {
          scores.push(variation.qualityScore)
        }
        if (variation.scoreBreakdown) {
          for (const [k, v] of Object.entries(variation.scoreBreakdown)) {
            if (!breakdown[k]) breakdown[k] = []
            breakdown[k].push(v)
          }
        }
      }
    }

    const qualityScore =
      scores.length > 0
        ? scores.reduce((sum, n) => sum + n, 0) / scores.length
        : 0

    const scoreBreakdown: Record<string, number> = {}
    for (const [k, arr] of Object.entries(breakdown)) {
      if (arr.length > 0) {
        scoreBreakdown[k] = arr.reduce((sum, n) => sum + n, 0) / arr.length
      }
    }

    return { qualityScore, scoreBreakdown }
  }

  // Export job methods
  static createExportJob(
    workspaceId: string,
    assetCount: number,
    captionCount: number,
    generatedAssetCount: number = 0
  ): ExportJob {
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const exportJob: ExportJob = {
      id: exportId,
      workspaceId,
      status: 'pending',
      assetCount,
      captionCount,
      generatedAssetCount,
      createdAt: new Date(),
    }

    exportJobs.set(exportId, exportJob)
    return exportJob
  }

  static getExportJobById(id: string): ExportJob | null {
    return exportJobs.get(id) || null
  }

  // Export jobs retrieval remains implemented once above

  static updateExportJob(
    id: string,
    updates: Partial<ExportJob>
  ): ExportJob | null {
    const job = exportJobs.get(id)
    if (!job) {
      return null
    }

    const updatedJob = {
      ...job,
      ...updates,
    }

    exportJobs.set(id, updatedJob)
    return updatedJob
  }

  static deleteExportJob(id: string): boolean {
    const job = exportJobs.get(id)
    if (!job) {
      return false
    }

    // Delete zip file if it exists
    if (job.zipFilePath) {
      try {
        const fs = require('fs')
        if (fs.existsSync(job.zipFilePath)) {
          fs.unlinkSync(job.zipFilePath)
        }
      } catch (error) {
        log.error(
          { err: error, zipFilePath: job.zipFilePath },
          'Error deleting zip file'
        )
      }
    }

    exportJobs.delete(id)
    return true
  }

  static getAllExportJobs(): ExportJob[] {
    return Array.from(exportJobs.values())
  }

  static getExportJobsByWorkspace(workspaceId: string): ExportJob[] {
    return Array.from(exportJobs.values()).filter(
      (job) => job.workspaceId === workspaceId
    )
  }

  static getExportHistory(
    workspaceId: string,
    limit: number = 10
  ): {
    total: number
    exports: ExportJob[]
    recentActivity: {
      date: string
      count: number
      status: string
    }[]
  } {
    const workspaceExports = this.getExportJobsByWorkspace(workspaceId)

    // Sort by creation date (most recent first)
    const sortedExports = workspaceExports.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Group by date for activity summary
    const activityMap = new Map<string, { count: number; status: string }>()

    sortedExports.forEach((exp) => {
      const dateKey = exp.createdAt.toISOString().split('T')[0]
      const existing = activityMap.get(dateKey) || {
        count: 0,
        status: 'completed',
      }
      activityMap.set(dateKey, {
        count: existing.count + 1,
        status: exp.status === 'completed' ? 'completed' : existing.status,
      })
    })

    const recentActivity = Array.from(activityMap.entries())
      .slice(0, 7) // Last 7 days
      .map(([date, data]) => ({
        date,
        ...data,
      }))

    return {
      total: workspaceExports.length,
      exports: sortedExports.slice(0, limit),
      recentActivity,
    }
  }

  static getExportStatistics(workspaceId: string): {
    totalExports: number
    completedExports: number
    failedExports: number
    averageProcessingTime: number
    totalAssetsExported: number
    totalGeneratedAssetsExported: number
    successRate: number
  } {
    const workspaceExports = this.getExportJobsByWorkspace(workspaceId)

    const completed = workspaceExports.filter(
      (job) => job.status === 'completed'
    )
    const failed = workspaceExports.filter((job) => job.status === 'failed')

    // Calculate average processing time for completed exports
    const processingTimes = completed
      .filter((job) => job.completedAt && job.createdAt)
      .map((job) => {
        const start = new Date(job.createdAt!).getTime()
        const end = new Date(job.completedAt!).getTime()
        return (end - start) / 1000 // Convert to seconds
      })

    const averageTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0

    const totalAssets = workspaceExports.reduce(
      (sum, job) => sum + job.assetCount,
      0
    )
    const totalGeneratedAssets = workspaceExports.reduce(
      (sum, job) => sum + (job.generatedAssetCount || 0),
      0
    )

    return {
      totalExports: workspaceExports.length,
      completedExports: completed.length,
      failedExports: failed.length,
      averageProcessingTime: Math.round(averageTime),
      totalAssetsExported: totalAssets,
      totalGeneratedAssetsExported: totalGeneratedAssets,
      successRate:
        workspaceExports.length > 0
          ? (completed.length / workspaceExports.length) * 100
          : 0,
    }
  }

  // GeneratedAsset methods
  static createGeneratedAsset(
    data: Omit<GeneratedAsset, 'id' | 'createdAt'>
  ): GeneratedAsset {
    const assetId = `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const generatedAsset: GeneratedAsset = {
      id: assetId,
      ...data,
      createdAt: new Date(),
    }

    generatedAssets.set(assetId, generatedAsset)
    return generatedAsset
  }

  static getGeneratedAssetById(id: string): GeneratedAsset | null {
    return generatedAssets.get(id) || null
  }

  static getGeneratedAssetsByJob(jobId: string): GeneratedAsset[] {
    return Array.from(generatedAssets.values()).filter(
      (asset) => asset.jobId === jobId
    )
  }

  static getGeneratedAssetsByWorkspace(workspaceId: string): GeneratedAsset[] {
    return Array.from(generatedAssets.values()).filter(
      (asset) => asset.workspaceId === workspaceId
    )
  }

  static getApprovedGeneratedAssets(workspaceId: string): GeneratedAsset[] {
    return Array.from(generatedAssets.values()).filter(
      (asset) =>
        asset.workspaceId === workspaceId && asset.approvalStatus === 'approved'
    )
  }

  static getApprovedGeneratedAssetsByCampaign(
    campaignId: string
  ): GeneratedAsset[] {
    return Array.from(generatedAssets.values()).filter(
      (asset) =>
        asset.campaignId === campaignId && asset.approvalStatus === 'approved'
    )
  }

  static updateGeneratedAsset(
    id: string,
    updates: Partial<GeneratedAsset>
  ): GeneratedAsset | null {
    const asset = generatedAssets.get(id)
    if (!asset) {
      return null
    }

    const updatedAsset = {
      ...asset,
      ...updates,
    }

    generatedAssets.set(id, updatedAsset)
    return updatedAsset
  }

  static approveGeneratedAsset(id: string): GeneratedAsset | null {
    return this.updateGeneratedAsset(id, {
      approvalStatus: 'approved',
      approvedAt: new Date(),
    })
  }

  static rejectGeneratedAsset(id: string): GeneratedAsset | null {
    return this.updateGeneratedAsset(id, {
      approvalStatus: 'rejected',
      rejectedAt: new Date(),
    })
  }

  static batchApproveGeneratedAssets(assetIds: string[]): {
    approved: number
    failed: number
  } {
    let approved = 0
    let failed = 0

    for (const assetId of assetIds) {
      if (this.approveGeneratedAsset(assetId)) {
        approved++
      } else {
        failed++
      }
    }

    return { approved, failed }
  }

  static batchRejectGeneratedAssets(assetIds: string[]): {
    rejected: number
    failed: number
  } {
    let rejected = 0
    let failed = 0

    for (const assetId of assetIds) {
      if (this.rejectGeneratedAsset(assetId)) {
        rejected++
      } else {
        failed++
      }
    }

    return { rejected, failed }
  }

  static deleteGeneratedAsset(id: string): boolean {
    const asset = generatedAssets.get(id)
    if (!asset) {
      return false
    }

    // Delete files if they exist
    try {
      const fs = require('fs')
      if (fs.existsSync(asset.imageUrl)) {
        fs.unlinkSync(asset.imageUrl)
      }
      if (fs.existsSync(asset.thumbnailUrl)) {
        fs.unlinkSync(asset.thumbnailUrl)
      }
    } catch (error) {
      log.error(
        { err: error, assetId: id },
        'Error deleting generated asset files'
      )
    }

    generatedAssets.delete(id)
    return true
  }

  static deleteGeneratedAssetsByJob(jobId: string): number {
    const jobAssets = this.getGeneratedAssetsByJob(jobId)
    let deletedCount = 0

    for (const asset of jobAssets) {
      if (this.deleteGeneratedAsset(asset.id)) {
        deletedCount++
      }
    }

    return deletedCount
  }

  static deleteGeneratedAssetsByWorkspace(workspaceId: string): number {
    const workspaceAssets = this.getGeneratedAssetsByWorkspace(workspaceId)
    let deletedCount = 0

    for (const asset of workspaceAssets) {
      if (this.deleteGeneratedAsset(asset.id)) {
        deletedCount++
      }
    }

    return deletedCount
  }

  static resetWorkspace(workspaceId: string): {
    deletedAssets: number
    deletedGeneratedAssets: number
    deletedCaptions: number
    deletedBrandKits: number
    deletedCampaigns: number
    deletedReferenceCreatives: number
    workspaceDeleted: boolean
  } {
    const deletedBrandKits = this.deleteBrandKitsByWorkspace(workspaceId)
    const deletedAssets = this.deleteAssetsByWorkspace(workspaceId)
    const deletedGeneratedAssets =
      this.deleteGeneratedAssetsByWorkspace(workspaceId)
    const deletedCaptions = this.deleteCaptionsByWorkspace(workspaceId)
    const deletedCampaigns = this.deleteCampaignsByWorkspace(workspaceId)
    const deletedReferenceCreatives =
      this.deleteReferenceCreativesByWorkspace(workspaceId)
    const workspaceDeleted = WorkspaceModel.deleteWorkspace(workspaceId)

    return {
      deletedAssets,
      deletedGeneratedAssets,
      deletedCaptions,
      deletedBrandKits,
      deletedCampaigns,
      deletedReferenceCreatives,
      workspaceDeleted,
    }
  }

  static getAllGeneratedAssets(): GeneratedAsset[] {
    return Array.from(generatedAssets.values())
  }

  // Campaign Management v2 Methods
  static async createCampaign(
    campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Campaign> {
    const id = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const campaign: Campaign = {
      ...campaignData,
      id,
      status: 'draft',
      qualityScore: campaignData.qualityScore ?? 0,
      scoreBreakdown: campaignData.scoreBreakdown ?? {},
      createdAt: now,
      updatedAt: now,
    }

    campaigns.set(id, campaign)
    return campaign
  }

  static getCampaignById(id: string): Campaign | null {
    return campaigns.get(id) || null
  }

  static getCampaignsByWorkspace(workspaceId: string): Campaign[] {
    return Array.from(campaigns.values()).filter(
      (c) => c.workspaceId === workspaceId
    )
  }

  static getCampaignsByAgency(agencyId: string): Campaign[] {
    const agencyWorkspaces = WorkspaceModel.getWorkspacesByAgency(agencyId)
    const workspaceIds = agencyWorkspaces.map((w) => w.id)
    return Array.from(campaigns.values()).filter((c) =>
      workspaceIds.includes(c.workspaceId)
    )
  }

  static async updateCampaign(
    id: string,
    updates: Partial<Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Campaign> {
    const campaign = campaigns.get(id)
    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      ...updates,
      updatedAt: new Date(),
      qualityScore:
        typeof updates.qualityScore === 'number'
          ? updates.qualityScore
          : campaign.qualityScore,
      scoreBreakdown: updates.scoreBreakdown || campaign.scoreBreakdown,
    }

    campaigns.set(id, updatedCampaign)
    return updatedCampaign
  }

  static deleteCampaign(id: string): boolean {
    return campaigns.delete(id)
  }

  static deleteCampaignsByWorkspace(workspaceId: string): number {
    const toDelete = Array.from(campaigns.values()).filter(
      (c) => c.workspaceId === workspaceId
    )
    let count = 0
    for (const c of toDelete) {
      if (campaigns.delete(c.id)) count++
    }
    return count
  }

  // Reference Creative Methods
  static async createReferenceCreative(
    referenceData: Omit<ReferenceCreative, 'id' | 'createdAt'>
  ): Promise<ReferenceCreative> {
    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const referenceCreative: ReferenceCreative = {
      ...referenceData,
      id,
      createdAt: now,
    }

    referenceCreatives.set(id, referenceCreative)
    return referenceCreative
  }

  static getReferenceCreativeById(id: string): ReferenceCreative | null {
    return referenceCreatives.get(id) || null
  }

  static getReferenceCreativesByWorkspace(
    workspaceId: string
  ): ReferenceCreative[] {
    return Array.from(referenceCreatives.values()).filter(
      (r) => r.workspaceId === workspaceId
    )
  }

  static getReferenceCreativesByCampaign(
    campaignId: string
  ): ReferenceCreative[] {
    return Array.from(referenceCreatives.values()).filter(
      (r) => r.campaignId === campaignId
    )
  }

  static async updateReferenceCreative(
    id: string,
    updates: Partial<Omit<ReferenceCreative, 'id' | 'createdAt'>>
  ): Promise<ReferenceCreative> {
    const referenceCreative = referenceCreatives.get(id)
    if (!referenceCreative) {
      throw new Error('Reference creative not found')
    }

    const updatedReferenceCreative: ReferenceCreative = {
      ...referenceCreative,
      ...updates,
    }

    referenceCreatives.set(id, updatedReferenceCreative)
    return updatedReferenceCreative
  }

  static deleteReferenceCreative(id: string): boolean {
    const referenceCreative = referenceCreatives.get(id)
    if (!referenceCreative) {
      return false
    }

    // Delete files if they exist
    try {
      const fs = require('fs')
      if (fs.existsSync(referenceCreative.imageUrl)) {
        fs.unlinkSync(referenceCreative.imageUrl)
      }
      if (fs.existsSync(referenceCreative.thumbnailUrl)) {
        fs.unlinkSync(referenceCreative.thumbnailUrl)
      }
    } catch (error) {
      log.error(
        { err: error, referenceId: id },
        'Error deleting reference creative files'
      )
    }

    return referenceCreatives.delete(id)
  }

  static deleteReferenceCreativesByWorkspace(workspaceId: string): number {
    const toDelete = Array.from(referenceCreatives.values()).filter(
      (r) => r.workspaceId === workspaceId
    )
    let count = 0
    for (const r of toDelete) {
      if (this.deleteReferenceCreative(r.id)) {
        count++
      }
    }
    return count
  }

  // Ad Creative Methods
  static async createAdCreative(
    adCreativeData: Omit<AdCreative, 'id'>
  ): Promise<AdCreative> {
    const id = `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const adCreative: AdCreative = {
      ...adCreativeData,
      id,
    }

    adCreatives.set(id, adCreative)
    return adCreative
  }

  static getAdCreativeById(id: string): AdCreative | null {
    return adCreatives.get(id) || null
  }

  static getAdCreativesByCampaign(campaignId: string): AdCreative[] {
    return Array.from(adCreatives.values()).filter(
      (ad) => ad.campaignId === campaignId
    )
  }

  static getAdCreativesByWorkspace(workspaceId: string): AdCreative[] {
    return Array.from(adCreatives.values()).filter(
      (ad) => ad.workspaceId === workspaceId
    )
  }

  static async updateAdCreative(
    id: string,
    updates: Partial<Omit<AdCreative, 'id'>>
  ): Promise<AdCreative> {
    const adCreative = adCreatives.get(id)
    if (!adCreative) {
      throw new Error('Ad creative not found')
    }

    const updatedAdCreative: AdCreative = {
      ...adCreative,
      ...updates,
    }

    adCreatives.set(id, updatedAdCreative)
    return updatedAdCreative
  }

  static deleteAdCreative(id: string): boolean {
    const adCreative = adCreatives.get(id)
    if (!adCreative) {
      return false
    }

    // Delete files if they exist
    try {
      const fs = require('fs')
      if (fs.existsSync(adCreative.imageUrl)) {
        fs.unlinkSync(adCreative.imageUrl)
      }
      if (fs.existsSync(adCreative.thumbnailUrl)) {
        fs.unlinkSync(adCreative.thumbnailUrl)
      }
    } catch (error) {
      log.error(
        { err: error, adCreativeId: id },
        'Error deleting ad creative files'
      )
    }

    return adCreatives.delete(id)
  }

  static getAllCampaigns(): Campaign[] {
    return Array.from(campaigns.values())
  }

  static getAllReferenceCreatives(): ReferenceCreative[] {
    return Array.from(referenceCreatives.values())
  }

  static getAllAdCreatives(): AdCreative[] {
    return Array.from(adCreatives.values())
  }

  // Template Memory System (added for Stage 4 - Template Memory & Style Learning)
  static getTemplateById(id: string): Template | null {
    return templates.get(id) || null
  }

  static getTemplatesByWorkspace(workspaceId: string): Template[] {
    return Array.from(templates.values()).filter(
      (t) => t.workspaceId === workspaceId
    )
  }

  static async createTemplate(
    template: Omit<Template, 'id' | 'createdAt'>
  ): Promise<Template> {
    const id = `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTemplate: Template = {
      ...template,
      id,
      createdAt: new Date(),
    }

    templates.set(id, newTemplate)
    return newTemplate
  }

  static async updateTemplate(
    id: string,
    updates: Partial<Omit<Template, 'id' | 'createdAt'>>
  ): Promise<Template> {
    const template = templates.get(id)
    if (!template) {
      throw new Error('Template not found')
    }

    const updatedTemplate: Template = {
      ...template,
      ...updates,
    }

    templates.set(id, updatedTemplate)
    return updatedTemplate
  }

  static deleteTemplate(id: string): boolean {
    return templates.delete(id)
  }

  static getAllTemplates(): Template[] {
    return Array.from(templates.values())
  }

  // Style Profile System (added for Stage 4 - Template Memory & Style Learning)
  static getStyleProfileById(id: string): StyleProfile | null {
    return styleProfiles.get(id) || null
  }

  static getStyleProfilesByWorkspace(workspaceId: string): StyleProfile[] {
    return Array.from(styleProfiles.values()).filter(
      (s) => s.workspaceId === workspaceId
    )
  }

  static async createStyleProfile(
    styleProfile: Omit<StyleProfile, 'id' | 'createdAt'>
  ): Promise<StyleProfile> {
    const id = `style_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newStyleProfile: StyleProfile = {
      ...styleProfile,
      id,
      createdAt: new Date(),
    }

    styleProfiles.set(id, newStyleProfile)
    return newStyleProfile
  }

  static async updateStyleProfile(
    id: string,
    updates: Partial<Omit<StyleProfile, 'id' | 'createdAt'>>
  ): Promise<StyleProfile> {
    const styleProfile = styleProfiles.get(id)
    if (!styleProfile) {
      throw new Error('Style profile not found')
    }

    const updatedStyleProfile: StyleProfile = {
      ...styleProfile,
      ...updates,
    }

    styleProfiles.set(id, updatedStyleProfile)
    return updatedStyleProfile
  }

  static deleteStyleProfile(id: string): boolean {
    return styleProfiles.delete(id)
  }

  static getAllStyleProfiles(): StyleProfile[] {
    return Array.from(styleProfiles.values())
  }

  // Additional methods needed for TemplateMemoryService
  static getCaptionsByCampaignAndStatus(
    campaignId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Caption[] {
    return CaptionModel.getAllCaptions().filter(
      (c) =>
        c.campaignId === campaignId &&
        (status ? c.approvalStatus === status : true)
    )
  }

  static getGeneratedAssetsByCampaignAndStatus(
    campaignId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): GeneratedAsset[] {
    return Array.from(generatedAssets.values()).filter(
      (ga) =>
        ga.campaignId === campaignId &&
        (status ? ga.approvalStatus === status : true)
    )
  }

  static getCaptionsByCampaign(campaignId: string): Caption[] {
    return CaptionModel.getCaptionsByCampaign(campaignId)
  }

  static deleteAssetsByWorkspace(workspaceId: string): number {
    return AssetModel.deleteAssetsByWorkspace(workspaceId)
  }

  static deleteCaptionsByWorkspace(workspaceId: string): number {
    return CaptionModel.deleteCaptionsByWorkspace(workspaceId)
  }

  static getAllCaptions(): Caption[] {
    return CaptionModel.getAllCaptions()
  }

  static getAllAssets(): Asset[] {
    return AssetModel.getAllAssets()
  }

  static getWorkspaceById(id: string): Workspace | null {
    return WorkspaceModel.getWorkspaceById(id)
  }

  static getApprovedCaptionsByWorkspace(workspaceId: string): Caption[] {
    return CaptionModel.getApprovedCaptionsByWorkspace(workspaceId)
  }

  static getBrandKitByWorkspace(workspaceId: string): BrandKit | undefined {
    return brandKits.get(workspaceId)
  }

  static getAssetById(id: string): Asset | null {
    return AssetModel.getAssetById(id)
  }

  static getCaptionById(id: string): Caption | null {
    return CaptionModel.getCaptionById(id)
  }

  static getBrandKitById(id: string): BrandKit | undefined {
    // In-memory fallback doesn't index by ID easily, but we can search
    for (const bk of brandKits.values()) {
      if (bk.id === id) return bk
    }
    return undefined
  }

  static getWorkspacesByAgency(agencyId: string): Workspace[] {
    return WorkspaceModel.getWorkspacesByAgency(agencyId)
  }

  static getAllWorkspaces(): Workspace[] {
    return WorkspaceModel.getAllWorkspaces()
  }

  static async createWorkspace(
    agencyId: string,
    clientName: string,
    industry?: string
  ): Promise<Workspace> {
    return WorkspaceModel.createWorkspace(agencyId, clientName, industry)
  }

  static updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>
  ): void {
    return WorkspaceModel.updateWorkspace(workspaceId, updates)
  }

  static addCaptionVariation(
    captionId: string,
    variation: Omit<CaptionVariation, 'id' | 'createdAt'>
  ): Caption | null {
    return CaptionModel.addCaptionVariation(captionId, variation)
  }

  static getBatchJobById(id: string): BatchJob | null {
    return BatchJobModel.getBatchJobById(id)
  }

  static updateBatchJob(
    id: string,
    updates: Partial<BatchJob>
  ): BatchJob | null {
    return BatchJobModel.updateBatchJob(id, updates)
  }

  static getCaptionsByAsset(assetId: string): Caption[] {
    return CaptionModel.getCaptionsByAsset(assetId)
  }

  static createCaption(
    assetId: string,
    workspaceId: string,
    campaignId?: string
  ): Caption {
    return CaptionModel.createCaption(assetId, workspaceId, campaignId)
  }

  static updateCaption(id: string, updates: Partial<Caption>): Caption | null {
    return CaptionModel.updateCaption(id, updates)
  }

  static createBatchJob(workspaceId: string, assetIds: string[]): BatchJob {
    return BatchJobModel.createBatchJob(workspaceId, assetIds)
  }

  static getAssetsByWorkspace(workspaceId: string): Asset[] {
    return AssetModel.getAssetsByWorkspace(workspaceId)
  }

  static getBatchJobsByWorkspace(workspaceId: string): BatchJob[] {
    return BatchJobModel.getBatchJobsByWorkspace(workspaceId)
  }

  static getCaptionsByWorkspace(workspaceId: string): Caption[] {
    return CaptionModel.getCaptionsByWorkspace(workspaceId)
  }

  static setPrimaryCaptionVariation(
    captionId: string,
    variationId: string
  ): Caption | null {
    return CaptionModel.setPrimaryCaptionVariation(captionId, variationId)
  }

  static deleteCaption(id: string): boolean {
    return CaptionModel.deleteCaption(id)
  }

  static deleteBrandKit(id: string): boolean {
    // Find workspaceId for this brand kit
    let workspaceId: string | undefined
    for (const bk of brandKits.values()) {
      if (bk.id === id) {
        workspaceId = bk.workspaceId
        break
      }
    }
    if (workspaceId) {
      return brandKits.delete(workspaceId)
    }
    return false
  }

  static getAllBrandKits(): BrandKit[] {
    return Array.from(brandKits.values())
  }

  static async createAsset(
    assetData: Omit<Asset, 'id' | 'uploadedAt'>
  ): Promise<Asset> {
    return AssetModel.createAsset(assetData)
  }

  static deleteAsset(id: string): boolean {
    return AssetModel.deleteAsset(id)
  }

  static approveCaptionVariation(
    captionId: string,
    variationId: string
  ): Caption | null {
    return CaptionModel.approveCaptionVariation(captionId, variationId)
  }

  static approveCaption(id: string): Caption | null {
    return CaptionModel.updateCaption(id, {
      approvalStatus: 'approved',
      approvedAt: new Date(),
    })
  }

  static rejectCaption(id: string, reason?: string): Caption | null {
    return CaptionModel.rejectCaption(id, reason)
  }

  static batchApproveCaptions(ids: string[]): {
    approved: number
    failed: number
  } {
    let approved = 0
    let failed = 0
    for (const id of ids) {
      if (this.approveCaption(id)) {
        approved++
      } else {
        failed++
      }
    }
    return { approved, failed }
  }

  static batchRejectCaptions(
    ids: string[],
    reason?: string
  ): { rejected: number; failed: number } {
    let rejected = 0
    let failed = 0
    for (const id of ids) {
      if (this.rejectCaption(id, reason)) {
        rejected++
      } else {
        failed++
      }
    }
    return { rejected, failed }
  }
}
