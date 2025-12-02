/**
 * Export API Client
 * Handles all export-related API calls for the approval workflow
 */

// Get base URL for API calls
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

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
 * Get authentication headers with JWT token
 */
function getHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Start a new export job for a workspace
 * @param workspaceId - ID of the workspace to export
 * @returns Promise resolving to the created export job
 */
export async function startExport(workspaceId: string): Promise<ExportJob> {
  const response = await fetch(
    `${API_URL}/export/workspace/${workspaceId}/start`,
    {
      method: 'POST',
      headers: getHeaders(),
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
  const response = await fetch(`${API_URL}/export/jobs/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
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
  const token = localStorage.getItem('authToken');
  const url = `${API_URL}/export/jobs/${jobId}/download`;

  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = token ? `${url}?token=${encodeURIComponent(token)}` : url;
  link.download = ''; // Let browser determine filename from Content-Disposition header
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get export summary for a workspace
 * @param workspaceId - ID of the workspace
 * @returns Promise resolving to export summary
 */
export async function getExportSummary(
  workspaceId: string
): Promise<ExportSummary> {
  const response = await fetch(
    `${API_URL}/export/workspace/${workspaceId}/summary`,
    {
      method: 'GET',
      headers: getHeaders(),
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

  const response = await fetch(
    `${API_URL}/export/workspace/${workspaceId}/jobs?${params}`,
    {
      method: 'GET',
      headers: getHeaders(),
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
  const response = await fetch(
    `${API_URL}/export/workspace/${workspaceId}/statistics`,
    {
      method: 'GET',
      headers: getHeaders(),
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
  const response = await fetch(`${API_URL}/export/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getHeaders(),
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
