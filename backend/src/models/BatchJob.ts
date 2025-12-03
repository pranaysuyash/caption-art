
export interface BatchJob {
  id: string
  workspaceId: string
  assetIds: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processedCount: number
  totalCount: number
  campaignId?: string // Optional campaign association
  template?:
    | 'punchy'
    | 'descriptive'
    | 'hashtag-heavy'
    | 'storytelling'
    | 'question'
  // Phase 1.1: Variation Engine extensions
  variations?: {
    variationType: 'main' | 'alt1' | 'alt2' | 'alt3' | 'punchy' | 'short' | 'story'
    count: number // Number of variations of this type to generate
  }[]
  generationMode?: 'caption' | 'adcopy' | 'video-script' | 'storyboard'
  brandKitId?: string // Brand kit for campaign-aware prompting
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
  createdAt: Date
}

const batchJobs = new Map<string, BatchJob>()

export class BatchJobModel {
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

  static getAllBatchJobs(): BatchJob[] {
    return Array.from(batchJobs.values())
  }
}
