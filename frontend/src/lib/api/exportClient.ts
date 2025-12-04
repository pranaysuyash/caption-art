/**
 * Export API Client
 * Handles all export-related API calls for the approval workflow
 */

import apiFetch from './httpClient';

// Export job statuses
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Export job response from backend
export interface ExportJob {
  id: string;
  workspaceId: string;
  status: ExportStatus;
  createdAt: string;
  completedAt?: string;
  zipFilePath?: string;
  totalCaptions: number;
  totalAssets: number;
  error?: string;
}

// Export summary response
export interface ExportSummary {
  workspace: {
    id: string;
    clientName: string;
  };
  readyForExport: boolean;
  totalApproved: number;
  totalAssets: number;
  estimatedSize: string;
  recentExports: ExportJob[];
}

// Export statistics
export interface ExportStatistics {
  workspaceId: string;
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  totalCaptionsExported: number;
  totalAssetsExported: number;
  averageExportTime: number;
  lastExportDate?: string;
}

/**
 * Start a new export job for a workspace
 * @param workspaceId - ID of the workspace to export
 * @returns Promise resolving to the created export job
 */
export async function startExport(workspaceId: string): Promise<ExportJob> {
  const response = await apiFetch(
    `/api/export/workspace/${workspaceId}/start`,
    {
      method: 'POST',
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to start export' }));
    throw new Error(error.error || 'Failed to start export');
  }

  const data = await response.json();
  return data.job || data;
}

/**
 * Get the status of an export job
 * @param jobId - ID of the export job
 * @returns Promise resolving to the export job
 */
export async function getJobStatus(jobId: string): Promise<ExportJob> {
  const response = await apiFetch(`/api/export/jobs/${jobId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to get job status' }));
    throw new Error(error.error || 'Failed to get job status');
  }

  const data = await response.json();
  return data.job;
}

/**
 * Poll an export job until it completes or fails
 * @param jobId - ID of the export job
 * @param onProgress - Optional callback for progress updates
 * @param pollInterval - Polling interval in milliseconds (default: 2000)
 * @returns Promise resolving to the completed export job
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (job: ExportJob) => void,
  pollInterval: number = 2000
): Promise<ExportJob> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const job = await getJobStatus(jobId);

        // Notify progress callback
        if (onProgress) {
          onProgress(job);
        }

        // Check if job is done
        if (job.status === 'completed') {
          resolve(job);
          return;
        }

        if (job.status === 'failed') {
          reject(new Error(job.error || 'Export failed'));
          return;
        }

        // Continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

/**
 * Download a completed export
 * @param jobId - ID of the export job
 * @returns Promise resolving when download starts
 */
export async function downloadExport(jobId: string): Promise<void> {
  // Use apiFetch to ensure credentials are included (cookies)
  const response = await apiFetch(`/api/export/jobs/${jobId}/download`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to download export');
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition') || '';
  let filename = '';
  const match = /filename="?([^\";]+)"?/.exec(contentDisposition);
  if (match) filename = match[1];

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'export.zip');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Get export summary for a workspace
 * @param workspaceId - ID of the workspace
 * @returns Promise resolving to export summary
 */
export async function getExportSummary(
  workspaceId: string
): Promise<ExportSummary> {
  const response = await apiFetch(
    `/api/export/workspace/${workspaceId}/summary`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to get export summary' }));
    throw new Error(error.error || 'Failed to get export summary');
  }

  return response.json();
}

/**
 * Get all export jobs for a workspace
 * @param workspaceId - ID of the workspace
 * @param options - Optional filtering options
 * @returns Promise resolving to list of export jobs
 */
export async function getWorkspaceJobs(
  workspaceId: string,
  options?: { status?: ExportStatus; limit?: number }
): Promise<ExportJob[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', options.limit.toString());

  const response = await apiFetch(
    `/api/export/workspace/${workspaceId}/jobs?${params}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to get workspace jobs' }));
    throw new Error(error.error || 'Failed to get workspace jobs');
  }

  const data = await response.json();
  return data.jobs || [];
}

/**
 * Get export statistics for a workspace
 * @param workspaceId - ID of the workspace
 * @returns Promise resolving to export statistics
 */
export async function getExportStatistics(
  workspaceId: string
): Promise<ExportStatistics> {
  const response = await apiFetch(
    `/api/export/workspace/${workspaceId}/statistics`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to get export statistics' }));
    throw new Error(error.error || 'Failed to get export statistics');
  }

  return response.json();
}

/**
 * Delete an export job
 * @param jobId - ID of the export job
 * @returns Promise resolving when job is deleted
 */
export async function deleteJob(jobId: string): Promise<void> {
  const response = await apiFetch(`/api/export/jobs/${jobId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to delete job' }));
    throw new Error(error.error || 'Failed to delete job');
  }
}

// Export as default object for convenience
export const exportClient = {
  startExport,
  getJobStatus,
  pollJobStatus,
  downloadExport,
  getExportSummary,
  getWorkspaceJobs,
  getExportStatistics,
  deleteJob,
};
