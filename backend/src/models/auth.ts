import bcrypt from 'bcrypt'

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

export interface Workspace {
  id: string
  agencyId: string
  clientName: string
  brandKitId: string
  createdAt: Date
}

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

  createdAt: Date
  updatedAt: Date
}

export interface Asset {
  id: string
  workspaceId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: Date
}

export interface Caption {
  id: string
  assetId: string
  workspaceId: string
  text: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  errorMessage?: string
  generatedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
}

export interface BatchJob {
  id: string
  workspaceId: string
  assetIds: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processedCount: number
  totalCount: number
  template?:
    | 'punchy'
    | 'descriptive'
    | 'hashtag-heavy'
    | 'storytelling'
    | 'question'
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
  createdAt: Date
}

export interface GeneratedAsset {
  id: string
  jobId: string
  sourceAssetId: string
  workspaceId: string
  captionId: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  format: 'instagram-square' | 'instagram-story'
  layout: 'center-focus' | 'bottom-text' | 'top-text'
  caption: string
  imageUrl: string
  thumbnailUrl: string
  watermark: boolean
  createdAt: Date
  generatedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
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

// Campaign Management v2
export interface Campaign {
  id: string
  workspaceId: string
  brandKitId: string
  name: string
  description?: string

  // Campaign objective and context
  objective: 'awareness' | 'traffic' | 'conversion' | 'engagement'
  launchType: 'new-launch' | 'evergreen' | 'seasonal' | 'sale' | 'event'
  funnelStage: 'cold' | 'warm' | 'hot'

  // Offer and CTA
  primaryOffer?: string // "Flat 20% off", "New summer collection"
  primaryCTA?: string // "Shop now", "Sign up", "Learn more"
  secondaryCTA?: string

  // Targeting and placement
  targetAudience?: string // More specific TA for this campaign
  placements: ('ig-feed' | 'ig-story' | 'fb-feed' | 'fb-story' | 'li-feed')[]

  // Creative constraints
  headlineMaxLength?: number
  bodyMaxLength?: number
  mustIncludePhrases?: string[]
  mustExcludePhrases?: string[]

  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: Date
  updatedAt: Date
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

export interface AdCreative extends GeneratedAsset {
  // Campaign-specific fields
  campaignId?: string
  placement: 'ig-feed' | 'ig-story' | 'fb-feed' | 'fb-story' | 'li-feed'

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
}

// In-memory storage for v1 (replace with database later)
const users = new Map<string, User>()
const agencies = new Map<string, Agency>()
const workspaces = new Map<string, Workspace>()
const brandKits = new Map<string, BrandKit>()
const assets = new Map<string, Asset>()
const captions = new Map<string, Caption>()
const batchJobs = new Map<string, BatchJob>()
const generatedAssets = new Map<string, GeneratedAsset>()
const exportJobs = new Map<string, ExportJob>()

// Campaign Management v2 storage
const campaigns = new Map<string, Campaign>()
const referenceCreatives = new Map<string, ReferenceCreative>()
const adCreatives = new Map<string, AdCreative>()

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
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const agencyId = `agency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const user: User = {
      id: userId,
      email,
      agencyId,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    }

    const agency: Agency = {
      id: agencyId,
      billingActive: false, // Free tier initially
      planType: 'free',
      createdAt: new Date(),
    }

    users.set(userId, user)
    agencies.set(agencyId, agency)

    return { user, agency }
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    for (const user of users.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  }

  static getUserById(id: string): User | null {
    return users.get(id) || null
  }

  static getAgencyById(id: string): Agency | null {
    return agencies.get(id) || null
  }

  static updateUserLastLogin(userId: string): void {
    const user = users.get(userId)
    if (user) {
      user.lastLoginAt = new Date()
    }
  }

  static async createWorkspace(
    agencyId: string,
    clientName: string
  ): Promise<Workspace> {
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const workspace: Workspace = {
      id: workspaceId,
      agencyId,
      clientName,
      brandKitId: '', // Will be set when brand kit is created
      createdAt: new Date(),
    }

    workspaces.set(workspaceId, workspace)
    return workspace
  }

  static getWorkspacesByAgency(agencyId: string): Workspace[] {
    return Array.from(workspaces.values()).filter(
      (w) => w.agencyId === agencyId
    )
  }

  static getWorkspaceById(id: string): Workspace | null {
    return workspaces.get(id) || null
  }

  static updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>
  ): void {
    const workspace = workspaces.get(workspaceId)
    if (workspace) {
      Object.assign(workspace, updates)
    }
  }

  // Brand Kit methods
  static async createBrandKit(
    brandKitData: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BrandKit> {
    const { workspaceId } = brandKitData

    // Verify workspace exists
    const workspace = workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Check if workspace already has a brand kit (v1: one per workspace)
    const existingBrandKits = Array.from(brandKits.values()).filter(
      (bk) => bk.workspaceId === workspaceId
    )
    if (existingBrandKits.length > 0) {
      throw new Error('Workspace already has a brand kit')
    }

    const brandKitId = `brandkit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const brandKit: BrandKit = {
      id: brandKitId,
      workspaceId,
      colors: brandKitData.colors,
      fonts: brandKitData.fonts,
      logo: brandKitData.logo,
      voicePrompt: brandKitData.voicePrompt,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    brandKits.set(brandKitId, brandKit)

    // Update workspace with brand kit ID
    workspace.brandKitId = brandKitId

    return brandKit
  }

  static getBrandKitById(id: string): BrandKit | null {
    return brandKits.get(id) || null
  }

  static getBrandKitByWorkspace(workspaceId: string): BrandKit | null {
    for (const brandKit of brandKits.values()) {
      if (brandKit.workspaceId === workspaceId) {
        return brandKit
      }
    }
    return null
  }

  static updateBrandKit(
    id: string,
    updates: Partial<Omit<BrandKit, 'id' | 'createdAt' | 'workspaceId'>>
  ): BrandKit | null {
    const brandKit = brandKits.get(id)
    if (!brandKit) {
      return null
    }

    const updatedBrandKit = {
      ...brandKit,
      ...updates,
      updatedAt: new Date(),
    }

    brandKits.set(id, updatedBrandKit)
    return updatedBrandKit
  }

  static deleteBrandKit(id: string): boolean {
    const brandKit = brandKits.get(id)
    if (!brandKit) {
      return false
    }

    // Clear brand kit reference from workspace
    const workspace = workspaces.get(brandKit.workspaceId)
    if (workspace) {
      workspace.brandKitId = ''
    }

    brandKits.delete(id)
    return true
  }

  static getAllBrandKits(): BrandKit[] {
    return Array.from(brandKits.values())
  }

  // Admin methods
  static getAllUsers(): User[] {
    return Array.from(users.values())
  }

  static getAllAgencies(): Agency[] {
    return Array.from(agencies.values())
  }

  static getAllWorkspaces(): Workspace[] {
    return Array.from(workspaces.values())
  }

  // Asset methods
  static async createAsset(
    assetData: Omit<Asset, 'id' | 'uploadedAt'>
  ): Promise<Asset> {
    const { workspaceId } = assetData

    // Verify workspace exists
    const workspace = workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Check workspace asset limit (20 files max for v1)
    const existingAssets = Array.from(assets.values()).filter(
      (a) => a.workspaceId === workspaceId
    )
    if (existingAssets.length >= 20) {
      throw new Error('Maximum 20 assets allowed per workspace')
    }

    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const asset: Asset = {
      id: assetId,
      workspaceId,
      filename: assetData.filename,
      originalName: assetData.originalName,
      mimeType: assetData.mimeType,
      size: assetData.size,
      url: assetData.url,
      uploadedAt: new Date(),
    }

    assets.set(assetId, asset)
    return asset
  }

  static getAssetById(id: string): Asset | null {
    return assets.get(id) || null
  }

  static getAssetsByWorkspace(workspaceId: string): Asset[] {
    return Array.from(assets.values()).filter(
      (a) => a.workspaceId === workspaceId
    )
  }

  static deleteAsset(id: string): boolean {
    const asset = assets.get(id)
    if (!asset) {
      return false
    }

    assets.delete(id)
    return true
  }

  static deleteAssetsByWorkspace(workspaceId: string): number {
    const workspaceAssets = Array.from(assets.values()).filter(
      (a) => a.workspaceId === workspaceId
    )
    let deletedCount = 0

    for (const asset of workspaceAssets) {
      if (assets.delete(asset.id)) {
        deletedCount++
      }
    }

    return deletedCount
  }

  static getAllAssets(): Asset[] {
    return Array.from(assets.values())
  }

  // Batch job methods
  static createBatchJob(workspaceId: string, assetIds: string[]): BatchJob {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const batchJob: BatchJob = {
      id: jobId,
      workspaceId,
      assetIds,
      status: 'pending',
      processedCount: 0,
      totalCount: assetIds.length,
      createdAt: new Date(),
    }

    batchJobs.set(jobId, batchJob)
    return batchJob
  }

  static getBatchJobById(id: string): BatchJob | null {
    return batchJobs.get(id) || null
  }

  static getBatchJobsByWorkspace(workspaceId: string): BatchJob[] {
    return Array.from(batchJobs.values()).filter(
      (job) => job.workspaceId === workspaceId
    )
  }

  static updateBatchJob(
    id: string,
    updates: Partial<BatchJob>
  ): BatchJob | null {
    const job = batchJobs.get(id)
    if (!job) {
      return null
    }

    const updatedJob = {
      ...job,
      ...updates,
    }

    batchJobs.set(id, updatedJob)
    return updatedJob
  }

  // Caption methods
  static createCaption(assetId: string, workspaceId: string): Caption {
    const captionId = `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const caption: Caption = {
      id: captionId,
      assetId,
      workspaceId,
      text: '',
      status: 'pending',
      approvalStatus: 'pending',
      createdAt: new Date(),
    }

    captions.set(captionId, caption)
    return caption
  }

  static getCaptionById(id: string): Caption | null {
    return captions.get(id) || null
  }

  static getCaptionsByWorkspace(workspaceId: string): Caption[] {
    return Array.from(captions.values()).filter(
      (c) => c.workspaceId === workspaceId
    )
  }

  static getCaptionsByAsset(assetId: string): Caption[] {
    return Array.from(captions.values()).filter((c) => c.assetId === assetId)
  }

  static updateCaption(id: string, updates: Partial<Caption>): Caption | null {
    const caption = captions.get(id)
    if (!caption) {
      return null
    }

    const updatedCaption = {
      ...caption,
      ...updates,
    }

    captions.set(id, updatedCaption)
    return updatedCaption
  }

  static deleteCaption(id: string): boolean {
    return captions.delete(id)
  }

  static deleteCaptionsByWorkspace(workspaceId: string): number {
    const workspaceCaptions = Array.from(captions.values()).filter(
      (c) => c.workspaceId === workspaceId
    )
    let deletedCount = 0

    for (const caption of workspaceCaptions) {
      if (captions.delete(caption.id)) {
        deletedCount++
      }
    }

    return deletedCount
  }

  static getAllBatchJobs(): BatchJob[] {
    return Array.from(batchJobs.values())
  }

  static getAllCaptions(): Caption[] {
    return Array.from(captions.values())
  }

  // Approval methods
  static approveCaption(captionId: string): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    const approvedCaption = {
      ...caption,
      approvalStatus: 'approved' as const,
      approvedAt: new Date(),
    }

    captions.set(captionId, approvedCaption)
    return approvedCaption
  }

  static rejectCaption(captionId: string, reason?: string): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    const rejectedCaption = {
      ...caption,
      approvalStatus: 'rejected' as const,
      rejectedAt: new Date(),
      errorMessage: reason || 'Rejected by user',
    }

    captions.set(captionId, rejectedCaption)
    return rejectedCaption
  }

  static batchApproveCaptions(captionIds: string[]): {
    approved: number
    failed: number
  } {
    let approved = 0
    let failed = 0

    for (const captionId of captionIds) {
      if (this.approveCaption(captionId)) {
        approved++
      } else {
        failed++
      }
    }

    return { approved, failed }
  }

  static batchRejectCaptions(
    captionIds: string[],
    reason?: string
  ): { rejected: number; failed: number } {
    let rejected = 0
    let failed = 0

    for (const captionId of captionIds) {
      if (this.rejectCaption(captionId, reason)) {
        rejected++
      } else {
        failed++
      }
    }

    return { rejected, failed }
  }

  static getApprovedCaptionsByWorkspace(workspaceId: string): Caption[] {
    return Array.from(captions.values()).filter(
      (c) => c.workspaceId === workspaceId && c.approvalStatus === 'approved'
    )
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
        console.error('Error deleting zip file:', error)
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
      console.error('Error deleting generated asset files:', error)
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
    const agencyWorkspaces = Array.from(workspaces.values()).filter(
      (w) => w.agencyId === agencyId
    )
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
    }

    campaigns.set(id, updatedCampaign)
    return updatedCampaign
  }

  static deleteCampaign(id: string): boolean {
    return campaigns.delete(id)
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
      console.error('Error deleting reference creative files:', error)
    }

    return referenceCreatives.delete(id)
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
      console.error('Error deleting ad creative files:', error)
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
}
