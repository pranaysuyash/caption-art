/**
 * Template Integration Service
 * Connects the template memory system with the creative engine
 */

import { AuthModel, Caption } from '../models/auth'
import { log } from '../middleware/logger'
import { TemplateMemoryService } from './TemplateMemoryService'
import { eventBus, CaptionApprovedEvent } from '../lib/eventBus'

export class TemplateIntegrationService {
  /**
   * Automatically learn from newly approved content and create templates
   */
  static async learnFromApproval(
    captionId: string,
    workspaceId: string,
    campaignId?: string
  ): Promise<void> {
    try {
      log.info(
        { captionId, workspaceId, campaignId },
        'Learning from newly approved content'
      )

      // Get the approved caption
      const caption = AuthModel.getCaptionById(captionId)
      if (!caption) {
        throw new Error(`Caption ${captionId} not found`)
      }

      // Only learn from approved content
      if (caption.approvalStatus !== 'approved') {
        log.debug(
          { captionId, approvalStatus: caption.approvalStatus },
          'Caption not approved, skipping learning'
        )
        return
      }

      // Learn from this approved work to create templates
      await TemplateMemoryService.learnFromApprovedWork(workspaceId, campaignId)

      log.info(
        { captionId, workspaceId, campaignId },
        'Template learning completed from approval'
      )
    } catch (error) {
      log.error(
        { err: error, captionId, workspaceId, campaignId },
        'Template learning from approval failed'
      )
      // Don't throw - this is an enhancement, not critical
    }
  }

  /**
   * Apply learned templates to new content generation
   */
  static async applyBestTemplate(
    workspaceId: string,
    context: {
      brandKitId: string
      campaignId?: string
      sourceText: string
      targetLength?: number
    }
  ): Promise<{
    caption: string
    confidence: number
    templateId: string
  } | null> {
    try {
      log.info(
        { workspaceId, campaignId: context.campaignId },
        'Applying best template to new content'
      )

      // Try to auto-apply the best template for this context
      const result = await TemplateMemoryService.autoApplyBestTemplate(
        workspaceId,
        {
          brandKit: AuthModel.getBrandKitById(context.brandKitId)!,
          campaign: context.campaignId
            ? AuthModel.getCampaignById(context.campaignId)
            : undefined,
          sourceText: context.sourceText,
          targetLength: context.targetLength,
        }
      )

      if (result) {
        log.info(
          {
            workspaceId,
            templateId: result.templateId,
            confidence: result.confidence,
          },
          'Best template applied successfully'
        )
      } else {
        log.debug({ workspaceId }, 'No suitable template found for application')
      }

      return result
    } catch (error) {
      log.error(
        { err: error, workspaceId, campaignId: context.campaignId },
        'Template application failed'
      )
      return null
    }
  }

  /**
   * Check if templates exist for a workspace/campaign and get recommendations
   */
  static async getTemplateRecommendations(
    workspaceId: string,
    campaignId?: string,
    limit: number = 5
  ): Promise<{ id: string; name: string; confidence: number }[]> {
    try {
      const templates = await TemplateMemoryService.getRecommendedTemplates(
        workspaceId,
        campaignId,
        limit
      )

      return templates.map((t) => ({
        id: t.id,
        name: t.name,
        confidence:
          t.performanceMetrics.approvalRate *
          (t.performanceMetrics.averageScore / 10) *
          (t.performanceMetrics.reuseCount / 10 + 0.1),
      }))
    } catch (error) {
      log.error(
        { err: error, workspaceId, campaignId },
        'Getting template recommendations failed'
      )
      return []
    }
  }

  /**
   * Auto-select the best performing templates for new campaigns
   */
  static async autoSelectTemplatesForNewCampaign(
    workspaceId: string,
    newCampaignId: string
  ): Promise<string[]> {
    try {
      // Get top-performing templates from other campaigns in this workspace
      const allTemplates = await TemplateMemoryService.getRecommendedTemplates(
        workspaceId,
        undefined,
        10
      )

      // Filter for the most successful templates (high approval rate, high scores, frequently reused)
      const topTemplates = allTemplates
        .filter(
          (t) =>
            t.performanceMetrics.approvalRate >= 0.8 &&
            t.performanceMetrics.averageScore >= 7
        )
        .sort((a, b) => {
          const scoreA =
            a.performanceMetrics.approvalRate *
            a.performanceMetrics.averageScore *
            a.performanceMetrics.reuseCount
          const scoreB =
            b.performanceMetrics.approvalRate *
            b.performanceMetrics.averageScore *
            b.performanceMetrics.reuseCount
          return scoreB - scoreA // Descending order
        })
        .slice(0, 3) // Top 3 templates

      const templateIds = topTemplates.map((t) => t.id)

      log.info(
        {
          workspaceId,
          newCampaignId,
          selectedTemplateCount: templateIds.length,
        },
        'Auto-selected templates for new campaign'
      )

      return templateIds
    } catch (error) {
      log.error(
        { err: error, workspaceId, newCampaignId },
        'Auto-selecting templates for new campaign failed'
      )
      return []
    }
  }
}

// Subscribe to caption approved events to trigger template learning
try {
  eventBus.on('caption:approved', async (ev: CaptionApprovedEvent) => {
    // Fire-and-forget learning; errors are logged inside the service
    await TemplateIntegrationService.learnFromApproval(
      ev.captionId,
      ev.workspaceId,
      ev.campaignId
    )
  })
} catch (err) {
  // Best-effort to log any issues during event subscription
  log.error({ err }, 'Failed to subscribe to caption:approved events')
}
