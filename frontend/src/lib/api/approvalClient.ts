/**
 * Approval API Client
 * Handles caption approval workflow with the backend
 */

import apiFetch from './httpClient';

export interface CaptionItem {
  id: string;
  assetId: string;
  workspaceId: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approved: boolean; // Derived from backend: approvalStatus === 'approved'
  qualityScore?: number; // 1-10 quality score
  scoreBreakdown?: {
    brandVoiceMatch: number;
    objectiveAlignment: number;
    lengthCompliance: number;
    constraintCompliance: number;
  };
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  asset?: {
    id: string;
    filename: string;
    url: string;
    thumbnailUrl?: string;
    mimeType: string;
    workspaceId: string;
  };
}

export interface CaptionsListResponse {
  captions: CaptionItem[];
  total: number;
}

export interface ApprovalResponse {
  caption: CaptionItem;
  message?: string;
}

export interface BulkApprovalResponse {
  approved: string[];
  rejected: string[];
  failed: string[];
  message?: string;
}

/**
 * Client for caption approval operations
 */
export class ApprovalClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all captions for a workspace (for approval grid)
   */
  async getWorkspaceCaptions(
    workspaceId: string
  ): Promise<CaptionsListResponse> {
    const response = await apiFetch(
      `${this.baseUrl}/api/batch/workspace/${workspaceId}/captions`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch captions');
    }

    return response.json();
  }

  /**
   * Get captions for a specific campaign
   */
  async getCampaignCaptions(
    workspaceId: string,
    campaignId: string
  ): Promise<CaptionsListResponse> {
    const response = await apiFetch(
      `${this.baseUrl}/api/batch/workspace/${workspaceId}/captions?campaignId=${campaignId}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch campaign captions');
    }

    return response.json();
  }

  /**
   * Approve a single caption
   */
  async approveCaption(captionId: string): Promise<ApprovalResponse> {
    const response = await apiFetch(
      `${this.baseUrl}/api/approval/captions/${captionId}/approve`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve caption');
    }

    return response.json();
  }

  /**
   * Reject a single caption
   */
  async rejectCaption(captionId: string): Promise<ApprovalResponse> {
    const response = await apiFetch(
      `${this.baseUrl}/api/approval/captions/${captionId}/reject`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject caption');
    }

    return response.json();
  }

  /**
   * Approve multiple captions in bulk
   */
  async bulkApprove(captionIds: string[]): Promise<BulkApprovalResponse> {
    const results = await Promise.allSettled(
      captionIds.map((id) => this.approveCaption(id))
    );

    const approved: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        approved.push(captionIds[index]);
      } else {
        failed.push(captionIds[index]);
      }
    });

    return {
      approved,
      rejected: [],
      failed,
      message: `Approved ${approved.length} of ${captionIds.length} captions`,
    };
  }

  /**
   * Reject multiple captions in bulk
   */
  async bulkReject(captionIds: string[]): Promise<BulkApprovalResponse> {
    const results = await Promise.allSettled(
      captionIds.map((id) => this.rejectCaption(id))
    );

    const rejected: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        rejected.push(captionIds[index]);
      } else {
        failed.push(captionIds[index]);
      }
    });

    return {
      approved: [],
      rejected,
      failed,
      message: `Rejected ${rejected.length} of ${captionIds.length} captions`,
    };
  }

  /**
   * Update caption text
   */
  async updateCaptionText(
    workspaceId: string,
    captionId: string,
    text: string
  ): Promise<{ caption: CaptionItem }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/batch/workspace/${workspaceId}/captions/${captionId}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update caption');
    }

    return response.json();
  }

  /**
   * Get approval grid data (captions with assets)
   */
  async getApprovalGrid(
    workspaceId: string,
    options?: {
      campaignId?: string;
      status?: 'pending' | 'approved' | 'rejected';
    }
  ): Promise<{ items: CaptionItem[] }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/approval/workspace/${workspaceId}/grid`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch approval grid');
    }

    const data = await response.json();

    // Filter by options if provided
    let items = data.items || [];

    if (options?.status) {
      items = items.filter(
        (item: CaptionItem) => item.approvalStatus === options.status
      );
    }

    if (options?.campaignId) {
      items = items.filter(
        (item: CaptionItem) => item.asset?.workspaceId === options.campaignId
      );
    }

    return { items };
  }
}

// Export singleton instance
export const approvalClient = new ApprovalClient();
