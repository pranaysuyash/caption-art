/**
 * Dashboard Service
 * Provides analytics and metrics dashboard data
 */

import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'
import { MetricsService } from './MetricsService'

// DashboardStats is declared above once; avoid duplicate declarations

export interface DashboardFilters {
  startDate?: Date
  endDate?: Date
  timeRange?: 'day' | 'week' | 'month' | 'quarter'
}

export interface DashboardStats {
  totalWorkspaces: number
  totalAssets: number
  totalCaptions: number
  totalGeneratedAssets: number
  totalCampaigns: number
  completedExports: number
  approvalStats: {
    total: number
    approved: number
    rejected: number
    pending: number
    approvalRate: number
  }
  captionQuality: {
    averageScore: number
    scoreDistribution: {
      '1-3': number
      '4-6': number
      '7-8': number
      '9-10': number
    }
  }
  platformUsage: {
    [key: string]: number
  }
  campaignPerformance: {
    [key: string]: {
      totalCaptions: number
      avgQualityScore: number
      approvalRate: number
    }
  }
  recentActivity: Array<{
    type: 'caption' | 'asset' | 'export' | 'approval'
    action: string
    timestamp: Date
    user?: string
    workspace: string
  }>
}

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(
    agencyId: string,
    filters?: DashboardFilters
  ): Promise<DashboardStats> {
    try {
      log.info({ agencyId, filters }, 'Fetching dashboard statistics')

      // Get all workspaces for this agency
      const workspaces = AuthModel.getWorkspacesByAgency(agencyId)
      const workspaceIds = workspaces.map((w) => w.id)

      // Determine date range for filtering
      let startDate: Date | undefined = filters?.startDate
      let endDate: Date | undefined = filters?.endDate

      if (filters?.timeRange) {
        const now = new Date()
        if (!startDate) {
          switch (filters.timeRange) {
            case 'day':
              startDate = new Date(now.setDate(now.getDate() - 1))
              break
            case 'week':
              startDate = new Date(now.setDate(now.getDate() - 7))
              break
            case 'month':
              startDate = new Date(now.setMonth(now.getMonth() - 1))
              break
            case 'quarter':
              startDate = new Date(now.setMonth(now.getMonth() - 3))
              break
          }
        }
      }

      // Get all assets across workspaces with date filtering
      const allAssets = AuthModel.getAllAssets().filter(
        (asset) =>
          workspaceIds.includes(asset.workspaceId) &&
          (!startDate || (asset.uploadedAt && asset.uploadedAt >= startDate)) &&
          (!endDate || (asset.uploadedAt && asset.uploadedAt <= endDate))
      )

      // Get all captions across workspaces with date filtering
      const allCaptions = AuthModel.getAllCaptions().filter(
        (caption) =>
          workspaceIds.includes(caption.workspaceId) &&
          (!startDate ||
            (caption.createdAt && caption.createdAt >= startDate)) &&
          (!endDate || (caption.createdAt && caption.createdAt <= endDate))
      )

      // Get all generated assets across workspaces with date filtering
      const allGeneratedAssets = AuthModel.getAllGeneratedAssets().filter(
        (asset) =>
          workspaceIds.includes(asset.workspaceId) &&
          (!startDate || (asset.createdAt && asset.createdAt >= startDate)) &&
          (!endDate || (asset.createdAt && asset.createdAt <= endDate))
      )

      // Get all campaigns across workspaces with date filtering
      const allCampaigns = AuthModel.getAllCampaigns().filter(
        (campaign) =>
          workspaceIds.includes(campaign.workspaceId) &&
          (!startDate ||
            (campaign.createdAt && campaign.createdAt >= startDate)) &&
          (!endDate || (campaign.createdAt && campaign.createdAt <= endDate))
      )

      // Get all export jobs across workspaces with date filtering
      const allExportJobs = AuthModel.getAllExportJobs().filter(
        (job) =>
          workspaceIds.includes(job.workspaceId) &&
          job.status === 'completed' &&
          (!startDate || (job.createdAt && job.createdAt >= startDate)) &&
          (!endDate || (job.completedAt && job.completedAt <= endDate))
      )

      // Calculate approval statistics
      const totalApprovalCount = allCaptions.length
      const approvedCaptions = allCaptions.filter(
        (c) => c.approvalStatus === 'approved'
      )
      const rejectedCaptions = allCaptions.filter(
        (c) => c.approvalStatus === 'rejected'
      )
      const pendingCaptions = allCaptions.filter(
        (c) => c.approvalStatus === 'pending'
      )

      const approvalRate =
        totalApprovalCount > 0
          ? (approvedCaptions.length / totalApprovalCount) * 100
          : 0

      // Calculate caption quality stats
      const qualityScores = allCaptions
        .flatMap((c) => c.variations.map((v) => v.qualityScore))
        .filter((score) => score !== undefined) as number[]

      const averageScore =
        qualityScores.length > 0
          ? qualityScores.reduce((sum, score) => sum + score, 0) /
            qualityScores.length
          : 0

      const scoreDistribution = {
        '1-3': qualityScores.filter((score) => score >= 1 && score <= 3).length,
        '4-6': qualityScores.filter((score) => score >= 4 && score <= 6).length,
        '7-8': qualityScores.filter((score) => score >= 7 && score <= 8).length,
        '9-10': qualityScores.filter((score) => score >= 9 && score <= 10)
          .length,
      }

      // Calculate platform usage (from variations)
      const platformUsage: { [key: string]: number } = {}
      for (const caption of allCaptions) {
        for (const variation of caption.variations) {
          // Prefer explicit metadata platform array (multi-platform captions)
          const platforms = variation.metadata?.platform || []
          if (platforms.length > 0) {
            for (const platform of platforms) {
              platformUsage[platform] = (platformUsage[platform] || 0) + 1
            }
          } else if (variation.adCopy?.platformSpecific) {
            // Derive platform from adCopy platformSpecific keys if present
            const keys = Object.keys(variation.adCopy.platformSpecific)
            if (keys.length > 0) {
              const platform = keys[0]
              platformUsage[platform] = (platformUsage[platform] || 0) + 1
            } else {
              platformUsage['unknown'] = (platformUsage['unknown'] || 0) + 1
            }
          } else {
            platformUsage['unknown'] = (platformUsage['unknown'] || 0) + 1
          }
        }
      }

      // Calculate campaign performance
      const campaignPerformance: { [key: string]: any } = {}
      for (const campaign of allCampaigns) {
        const campaignCaptions = allCaptions.filter(
          (c) => c.campaignId && c.campaignId === campaign.id
        )

        if (campaignCaptions.length > 0) {
          const campaignQualityScores = campaignCaptions
            .flatMap((c) => c.variations.map((v) => v.qualityScore))
            .filter((score) => score !== undefined) as number[]

          const avgQualityScore =
            campaignQualityScores.length > 0
              ? campaignQualityScores.reduce((sum, score) => sum + score, 0) /
                campaignQualityScores.length
              : 0

          const approvedCount = campaignCaptions.filter(
            (c) => c.approvalStatus === 'approved'
          ).length
          const approvalRate =
            campaignCaptions.length > 0
              ? (approvedCount / campaignCaptions.length) * 100
              : 0

          campaignPerformance[campaign.id] = {
            totalCaptions: campaignCaptions.length,
            avgQualityScore: parseFloat(avgQualityScore.toFixed(2)),
            approvalRate: parseFloat(approvalRate.toFixed(2)),
          }
        }
      }

      // Get recent activity (last 10 items)
      const recentActivity: Array<{
        type: 'caption' | 'asset' | 'export' | 'approval'
        action: string
        timestamp: Date
        user?: string
        workspace: string
      }> = []

      // Add recent captions
      const recentCaptions = [...allCaptions]
        .sort(
          (a, b) =>
            (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        )
        .slice(0, 3)
        .map((c) => ({
          type: 'caption' as const,
          action:
            c.approvalStatus === 'approved'
              ? 'approved'
              : c.approvalStatus === 'rejected'
                ? 'rejected'
                : 'generated',
          timestamp: c.createdAt,
          workspace: c.workspaceId || 'unknown',
        }))

      // Add recent assets
      const recentAssets = [...allAssets]
        .sort(
          (a, b) =>
            (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0)
        )
        .slice(0, 3)
        .map((a) => ({
          type: 'asset' as const,
          action: 'uploaded',
          timestamp: a.uploadedAt,
          workspace: a.workspaceId,
        }))

      // Add recent exports
      const recentExports = [...allExportJobs]
        .sort(
          (a, b) =>
            (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
        )
        .slice(0, 4)
        .map((e) => ({
          type: 'export' as const,
          action: 'completed',
          timestamp: e.completedAt || e.createdAt,
          workspace: e.workspaceId,
        }))

      // Combine and sort by timestamp
      recentActivity.push(...recentCaptions, ...recentAssets, ...recentExports)
      recentActivity.sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      )
      const finalRecentActivity = recentActivity.slice(0, 10)

      const result: DashboardStats = {
        totalWorkspaces: workspaces.length,
        totalAssets: allAssets.length,
        totalCaptions: allCaptions.length,
        totalGeneratedAssets: allGeneratedAssets.length,
        totalCampaigns: allCampaigns.length,
        completedExports: allExportJobs.length,
        approvalStats: {
          total: totalApprovalCount,
          approved: approvedCaptions.length,
          rejected: rejectedCaptions.length,
          pending: pendingCaptions.length,
          approvalRate: parseFloat(approvalRate.toFixed(2)),
        },
        captionQuality: {
          averageScore: parseFloat(averageScore.toFixed(2)),
          scoreDistribution,
        },
        platformUsage,
        campaignPerformance,
        recentActivity: finalRecentActivity,
      }

      log.info(
        {
          agencyId,
          stats: {
            workspaces: result.totalWorkspaces,
            assets: result.totalAssets,
            captions: result.totalCaptions,
            approved: result.approvalStats.approved,
          },
        },
        'Dashboard stats generated'
      )

      return result
    } catch (error) {
      log.error({ err: error, agencyId }, 'Error generating dashboard stats')
      throw error
    }
  }

  /**
   * Get metrics suitable for visualization dashboards
   */
  static async getVisualizationMetrics(agencyId: string): Promise<{
    dailyActivity: Array<{
      date: string
      uploads: number
      generations: number
      exports: number
    }>
    topCampaigns: Array<{
      campaignId: string
      name: string
      totalCaptions: number
      avgScore: number
      approvalRate: number
    }>
    performanceTrends: {
      captionLatency: Array<{ date: string; p95: number; p50: number }>
      approvalSpeed: Array<{ date: string; avgSeconds: number }>
    }
  }> {
    // This would implement more detailed visualization data
    // For now returning a simple structure showing the concept
    const workspaces = AuthModel.getWorkspacesByAgency(agencyId)
    const workspaceIds = workspaces.map((w) => w.id)

    // Get all relevant data from the last 30 days
    // Get all relevant data from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const filteredCaptions = AuthModel.getAllCaptions().filter(
      (caption) =>
        workspaceIds.includes(caption.workspaceId) &&
        caption.createdAt &&
        caption.createdAt > thirtyDaysAgo
    )

    const filteredAssets = AuthModel.getAllAssets().filter(
      (asset) =>
        workspaceIds.includes(asset.workspaceId) &&
        asset.uploadedAt &&
        asset.uploadedAt > thirtyDaysAgo
    )

    const filteredExportJobs = AuthModel.getAllExportJobs().filter(
      (job) =>
        workspaceIds.includes(job.workspaceId) &&
        job.completedAt &&
        job.completedAt > thirtyDaysAgo
    )

    // Group data by date
    const dailyActivity: Array<{
      date: string
      uploads: number
      generations: number
      exports: number
    }> = []
    const dateMap = new Map<
      string,
      { uploads: number; generations: number; exports: number }
    >()

    // Process assets (uploads)
    for (const asset of filteredAssets) {
      if (asset.uploadedAt) {
        const date = asset.uploadedAt.toISOString().split('T')[0]
        const dayData = dateMap.get(date) || {
          uploads: 0,
          generations: 0,
          exports: 0,
        }
        dayData.uploads++
        dateMap.set(date, dayData)
      }
    }

    // Process captions (generations)
    for (const caption of filteredCaptions) {
      if (caption.createdAt) {
        const date = caption.createdAt.toISOString().split('T')[0]
        const dayData = dateMap.get(date) || {
          uploads: 0,
          generations: 0,
          exports: 0,
        }
        dayData.generations++
        dateMap.set(date, dayData)
      }
    }

    // Process exports
    for (const job of filteredExportJobs) {
      if (job.completedAt) {
        const date = job.completedAt.toISOString().split('T')[0]
        const dayData = dateMap.get(date) || {
          uploads: 0,
          generations: 0,
          exports: 0,
        }
        dayData.exports++
        dateMap.set(date, dayData)
      }
    }

    // Convert map to array and sort by date
    for (const [date, data] of dateMap.entries()) {
      dailyActivity.push({ date, ...data })
    }

    dailyActivity.sort((a, b) => a.date.localeCompare(b.date))

    // Get top campaigns by performance
    const allCampaigns = AuthModel.getAllCampaigns().filter((campaign) =>
      workspaceIds.includes(campaign.workspaceId)
    )

    const topCampaigns = allCampaigns
      .map((campaign) => {
        const campaignCaptions = filteredCaptions.filter(
          (caption) => caption.campaignId && caption.campaignId === campaign.id
        )

        if (campaignCaptions.length === 0) return null

        const qualityScores = campaignCaptions
          .flatMap((c) => c.variations.map((v) => v.qualityScore))
          .filter((score) => score !== undefined) as number[]

        const avgScore =
          qualityScores.length > 0
            ? qualityScores.reduce((sum, score) => sum + score, 0) /
              qualityScores.length
            : 0

        const approvedCount = campaignCaptions.filter(
          (c) => c.approvalStatus === 'approved'
        ).length
        const approvalRate =
          campaignCaptions.length > 0
            ? (approvedCount / campaignCaptions.length) * 100
            : 0

        return {
          campaignId: campaign.id,
          name: campaign.name,
          totalCaptions: campaignCaptions.length,
          avgScore: parseFloat(avgScore.toFixed(2)),
          approvalRate: parseFloat(approvalRate.toFixed(2)),
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5)

    return {
      dailyActivity,
      topCampaigns,
      performanceTrends: {
        captionLatency: [], // Would come from metrics/tracing
        approvalSpeed: [], // Would come from approval metrics
      },
    }
  }
}
