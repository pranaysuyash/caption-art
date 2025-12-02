/**
 * ExportModal Component
 * Shows export progress and handles the export workflow
 */

import { useState, useEffect } from 'react';
import { exportClient, ExportJob, ExportStatus } from '../lib/api/exportClient';
import './ExportModal.css';

interface ExportModalProps {
  workspaceId: string;
  onClose: () => void;
  onComplete?: (job: ExportJob) => void;
}

export function ExportModal({
  workspaceId,
  onClose,
  onComplete,
}: ExportModalProps) {
  const [status, setStatus] = useState<ExportStatus>('pending');
  const [job, setJob] = useState<ExportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    startExportProcess();
  }, [workspaceId]);

  const startExportProcess = async () => {
    try {
      setStatus('pending');
      setProgress(10);

      // Start the export
      const newJob = await exportClient.startExport(workspaceId);
      setJob(newJob);
      setProgress(25);

      // Poll for completion
      await exportClient.pollJobStatus(
        newJob.id,
        (updatedJob) => {
          setJob(updatedJob);
          setStatus(updatedJob.status);

          // Update progress based on status
          if (updatedJob.status === 'processing') {
            setProgress(50);
          } else if (updatedJob.status === 'completed') {
            setProgress(100);
          }
        },
        2000 // Poll every 2 seconds
      );

      // Job completed, trigger download
      if (job && job.id) {
        await exportClient.downloadExport(job.id);
        if (onComplete) {
          onComplete(job);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      setStatus('failed');
    }
  };

  const getStatusMessage = (): string => {
    switch (status) {
      case 'pending':
        return 'Preparing export...';
      case 'processing':
        return 'Creating export package...';
      case 'completed':
        return 'Export complete! Download starting...';
      case 'failed':
        return error || 'Export failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const handleClose = () => {
    // Only allow closing if completed or failed
    if (status === 'completed' || status === 'failed') {
      onClose();
    }
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    startExportProcess();
  };

  return (
    <div className='export-modal-overlay' onClick={handleClose}>
      <div className='export-modal' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='export-modal-header'>
          <h2>Exporting Approved Captions</h2>
          {(status === 'completed' || status === 'failed') && (
            <button
              className='close-button'
              onClick={handleClose}
              aria-label='Close'
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className='export-modal-content'>
          {/* Status icon */}
          <div className='status-icon'>
            <span className='icon-large'>{getStatusIcon()}</span>
          </div>

          {/* Status message */}
          <div className='status-message'>{getStatusMessage()}</div>

          {/* Progress bar */}
          {status !== 'failed' && (
            <div className='progress-container'>
              <div
                className={`progress-bar ${
                  status === 'completed'
                    ? 'progress-bar-completed'
                    : 'progress-bar-active'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Job details */}
          {job && (
            <div className='export-details'>
              <div className='detail-row'>
                <span className='detail-label'>Captions:</span>
                <span className='detail-value'>{job.totalCaptions}</span>
              </div>
              <div className='detail-row'>
                <span className='detail-label'>Assets:</span>
                <span className='detail-value'>{job.totalAssets}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className='error-message'>
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className='export-actions'>
            {status === 'failed' && (
              <button onClick={handleRetry} className='btn btn-primary'>
                Retry Export
              </button>
            )}
            {status === 'completed' && (
              <button onClick={handleClose} className='btn btn-success'>
                Done
              </button>
            )}
            {(status === 'pending' || status === 'processing') && (
              <div className='loading-spinner'>
                <div className='spinner' />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
