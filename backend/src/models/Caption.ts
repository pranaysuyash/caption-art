import { log } from '../middleware/logger'

export interface AdCopyContent {
  headline: string
  subheadline?: string
  primaryText: string
  bodyText: string // Alias for primaryText for compatibility
  ctaText: string
  platformSpecific?: {
    instagram?: {
      headline: string
      primaryText: string
      ctaText: string
    }
    facebook?: {
      headline: string
      primaryText: string
      ctaText: string
    }
    linkedin?: {
      headline: string
      primaryText: string
      ctaText: string
    }
  }
}

export interface CaptionVariation {
  id: string
  label: 'main' | 'alt1' | 'alt2' | 'alt3' | 'punchy' | 'short' | 'story'
  text: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approved: boolean // For backward compatibility
  qualityScore?: number // 1-10 quality score
  scoreBreakdown?: {
    clarity: number
    originality: number
    brandConsistency: number
    platformRelevance: number
  }
  metadata?: {
    readingGrade?: number
    toneClassification?: string[]
    platform?: string[]
  }
  adCopy?: AdCopyContent
  errorMessage?: string
  generatedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
}

export interface Caption {
  id: string
  assetId: string
  workspaceId: string
  campaignId?: string // Optional campaign association
  variations: CaptionVariation[] // Array of 7 variation types: main, alt1-alt3, punchy, short, story
  primaryVariationId?: string // ID of the primary/selected variation
  status: 'pending' | 'generating' | 'completed' | 'failed'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  errorMessage?: string
  generatedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
  // Phase 1.1: Additional metadata for variation engine
  generationMode?: 'caption' | 'adcopy' | 'video-script' | 'storyboard'
  brandKitId?: string // Brand kit used for generation

  // Legacy/Derived properties for compatibility
  text?: string
  qualityScore?: number
}

const captions = new Map<string, Caption>()

export class CaptionModel {
  static createCaption(
    assetId: string,
    workspaceId: string,
    campaignId?: string
  ): Caption {
    const captionId = `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const caption: Caption = {
      id: captionId,
      assetId,
      workspaceId,
      campaignId,
      variations: [],
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

  static getCaptionsByCampaign(campaignId: string): Caption[] {
    return Array.from(captions.values()).filter(
      (c) => c.campaignId === campaignId
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

  static addCaptionVariation(
    captionId: string,
    variation: Omit<CaptionVariation, 'id' | 'createdAt'>
  ): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    const variationId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newVariation: CaptionVariation = {
      ...variation,
      id: variationId,
      createdAt: new Date(),
      status: variation.status || 'completed',
      approvalStatus: variation.approvalStatus || 'pending',
    }

    const updatedCaption = {
      ...caption,
      variations: [...caption.variations, newVariation],
    }

    // If this is the first variation, set it as primary
    if (caption.variations.length === 0) {
      updatedCaption.primaryVariationId = variationId
    }

    captions.set(captionId, updatedCaption)
    return updatedCaption
  }

  static updateCaptionVariation(
    captionId: string,
    variationId: string,
    updates: Partial<CaptionVariation>
  ): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    const variationIndex = caption.variations.findIndex(
      (v) => v.id === variationId
    )
    if (variationIndex === -1) {
      return null
    }

    const updatedVariations = [...caption.variations]
    updatedVariations[variationIndex] = {
      ...updatedVariations[variationIndex],
      ...updates,
    }

    const updatedCaption = {
      ...caption,
      variations: updatedVariations,
    }

    captions.set(captionId, updatedCaption)
    return updatedCaption
  }

  static setPrimaryCaptionVariation(
    captionId: string,
    variationId: string
  ): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    // Verify the variation exists
    const variationExists = caption.variations.some((v) => v.id === variationId)
    if (!variationExists) {
      return null
    }

    const updatedCaption = {
      ...caption,
      primaryVariationId: variationId,
    }

    captions.set(captionId, updatedCaption)
    return updatedCaption
  }

  static getPrimaryCaptionVariation(
    captionId: string
  ): CaptionVariation | null {
    const caption = captions.get(captionId)
    if (!caption || !caption.primaryVariationId) {
      return null
    }

    const variation = caption.variations.find(
      (v) => v.id === caption.primaryVariationId
    )
    return variation || null
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

  static getAllCaptions(): Caption[] {
    return Array.from(captions.values())
  }

  static approveCaption(
    captionId: string,
    variationId?: string
  ): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    // If no variation ID is specified, approve the primary variation or the first one
    if (!variationId) {
      if (caption.primaryVariationId) {
        return this.approveCaptionVariation(
          captionId,
          caption.primaryVariationId
        )
      } else if (caption.variations.length > 0) {
        return this.approveCaptionVariation(captionId, caption.variations[0].id)
      } else {
        // If no variations exist, approve the caption at the main level
        const approvedCaption = {
          ...caption,
          approvalStatus: 'approved' as const,
          approvedAt: new Date(),
        }

        captions.set(captionId, approvedCaption)
        return approvedCaption
      }
    } else {
      return this.approveCaptionVariation(captionId, variationId)
    }
  }

  static approveCaptionVariation(
    captionId: string,
    variationId: string
  ): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    const variationIndex = caption.variations.findIndex(
      (v) => v.id === variationId
    )
    if (variationIndex === -1) {
      return null
    }

    // Update the specific variation to approved
    const updatedVariations = [...caption.variations]
    updatedVariations[variationIndex] = {
      ...updatedVariations[variationIndex],
      approvalStatus: 'approved' as const,
      approvedAt: new Date(),
    }

    // Update the main caption approval status based on variations
    const hasApprovedVariation = updatedVariations.some(
      (v) => v.approvalStatus === 'approved'
    )
    const allVariationsRejected = updatedVariations.every(
      (v) => v.approvalStatus === 'rejected'
    )

    let newApprovalStatus: 'pending' | 'approved' | 'rejected' = 'pending'
    if (hasApprovedVariation) {
      newApprovalStatus = 'approved'
    } else if (allVariationsRejected) {
      newApprovalStatus = 'rejected'
    }

    const approvedCaption = {
      ...caption,
      variations: updatedVariations,
      approvalStatus: newApprovalStatus,
      approvedAt:
        newApprovalStatus === 'approved' ? new Date() : caption.approvedAt,
    }

    // Set this variation as the primary one when approved
    approvedCaption.primaryVariationId = variationId

    captions.set(captionId, approvedCaption)

    // Trigger template learning from this approved variation via event bus
    try {
      const { eventBus } = require('../lib/eventBus')
      eventBus.emit('caption:approved', {
        captionId,
        workspaceId: caption.workspaceId,
        campaignId: caption.campaignId,
      })
    } catch (err) {
      log.error({ err, captionId }, 'Error emitting caption approved event')
    }

    return approvedCaption
  }

  static rejectCaption(
    captionId: string,
    reason?: string,
    variationId?: string
  ): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    // If no variation ID is specified, reject the primary variation or the first one
    if (!variationId) {
      if (caption.primaryVariationId) {
        return this.rejectCaptionVariation(
          captionId,
          reason,
          caption.primaryVariationId
        )
      } else if (caption.variations.length > 0) {
        return this.rejectCaptionVariation(
          captionId,
          reason,
          caption.variations[0].id
        )
      } else {
        // If no variations exist, reject the caption at the main level
        const rejectedCaption = {
          ...caption,
          approvalStatus: 'rejected' as const,
          rejectedAt: new Date(),
          errorMessage: reason || 'Rejected by user',
        }

        captions.set(captionId, rejectedCaption)
        return rejectedCaption
      }
    } else {
      return this.rejectCaptionVariation(captionId, reason, variationId)
    }
  }

  static rejectCaptionVariation(
    captionId: string,
    reason: string | undefined,
    variationId: string
  ): Caption | null {
    const caption = captions.get(captionId)
    if (!caption) {
      return null
    }

    const variationIndex = caption.variations.findIndex(
      (v) => v.id === variationId
    )
    if (variationIndex === -1) {
      return null
    }

    // Update the specific variation to rejected
    const updatedVariations = [...caption.variations]
    updatedVariations[variationIndex] = {
      ...updatedVariations[variationIndex],
      approvalStatus: 'rejected' as const,
      rejectedAt: new Date(),
      errorMessage: reason,
    }

    // Update the main caption approval status based on variations
    const hasApprovedVariation = updatedVariations.some(
      (v) => v.approvalStatus === 'approved'
    )
    const allVariationsRejected = updatedVariations.every(
      (v) => v.approvalStatus === 'rejected'
    )

    let newApprovalStatus: 'pending' | 'approved' | 'rejected' = 'pending'
    if (hasApprovedVariation) {
      newApprovalStatus = 'approved'
    } else if (allVariationsRejected) {
      newApprovalStatus = 'rejected'
    }

    const rejectedCaption = {
      ...caption,
      variations: updatedVariations,
      approvalStatus: newApprovalStatus,
      rejectedAt:
        newApprovalStatus === 'rejected' ? new Date() : caption.rejectedAt,
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
}
