/**
 * ApprovalGrid Component
 * Requirements: Agency workflow for reviewing and approving generated creatives
 *
 * Displays a grid of generated assets with inline editing capabilities for:
 * - Headlines, subheadlines, body text, CTA text
 * - Approval/rejection actions
 * - Batch operations
 * - Export preparation
 */

import { useState, useEffect } from 'react';
import { approvalClient, CaptionItem } from '../lib/api/approvalClient';
import { ExportModal } from './ExportModal';
import './ApprovalGrid.css';

export interface ApprovalGridProps {
  workspaceId: string;
  campaignId?: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  onApprove?: (ids: string[]) => void;
  onReject?: (ids: string[]) => void;
  onExport?: (ids: string[]) => void;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

/**
 * ApprovalGrid component for agency creative review workflow
 */
export function ApprovalGrid({
  workspaceId,
  campaignId,
  onSelectionChange,
  onApprove,
  onReject,
  onExport,
}: ApprovalGridProps) {
  const [items, setItems] = useState<CaptionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [approvedCount, setApprovedCount] = useState(0);
  const [targetCount] = useState(30); // Target number of approved captions
  const [showExportModal, setShowExportModal] = useState(false);

  // Load captions from backend
  useEffect(() => {
    loadItems();
  }, [workspaceId, campaignId]);

  // Update approved count when items change
  useEffect(() => {
    const count = items.filter((item) => item.approved).length;
    setApprovedCount(count);
  }, [items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await approvalClient.getApprovalGrid(workspaceId, {
        campaignId,
      });

      setItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load captions');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered items
  const filteredItems =
    filter === 'all'
      ? items
      : items.filter((item) => item.approvalStatus === filter);

  // Handle selection
  const handleSelect = (id: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);

    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? filteredItems.map((item) => item.id) : [];
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  // Approval actions
  const handleApprove = async (ids: string[]) => {
    try {
      const result = await approvalClient.bulkApprove(ids);

      // Reload items to get updated state
      await loadItems();

      // Clear selection
      setSelectedIds([]);

      onApprove?.(result.approved);
    } catch (err) {
      console.error('Approve error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to approve captions'
      );
    }
  };

  const handleReject = async (ids: string[]) => {
    try {
      const result = await approvalClient.bulkReject(ids);

      // Reload items to get updated state
      await loadItems();

      // Clear selection
      setSelectedIds([]);

      onReject?.(result.rejected);
    } catch (err) {
      console.error('Reject error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to reject captions'
      );
    }
  };

  const handleAutoApprove = async () => {
    // Find all pending captions with quality score >= 8
    const highScoringIds = items
      .filter(
        (item) =>
          item.approvalStatus === 'pending' &&
          item.qualityScore !== undefined &&
          item.qualityScore >= 8
      )
      .map((item) => item.id);

    if (highScoringIds.length === 0) {
      alert('No pending captions with quality score >= 8 found');
      return;
    }

    const confirmed = window.confirm(
      `Auto-approve ${highScoringIds.length} high-scoring captions (score >= 8)?`
    );

    if (!confirmed) return;

    try {
      const result = await approvalClient.bulkApprove(highScoringIds);

      // Reload items to get updated state
      await loadItems();

      // Clear selection
      setSelectedIds([]);

      onApprove?.(result.approved);
    } catch (err) {
      console.error('Auto-approve error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to auto-approve captions'
      );
    }
  };

  // Inline editing for caption text
  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditingText(currentText);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      await approvalClient.updateCaptionText(
        workspaceId,
        editingId,
        editingText
      );

      // Update local state
      setItems(
        items.map((item) =>
          item.id === editingId ? { ...item, text: editingText } : item
        )
      );
    } catch (err) {
      console.error('Save edit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update caption');
    } finally {
      setEditingId(null);
      setEditingText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✓';
      case 'rejected':
        return '✕';
      case 'pending':
        return '⏱';
      default:
        return '?';
    }
  };

  if (loading) {
    return (
      <div className='approval-grid-loading'>
        <div className='loading-spinner'>⚙️</div>
        <div className='loading-text'>Loading creative assets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='approval-grid-error'>
        <span className='error-icon'>⚠️</span>
        <span className='error-message'>{error}</span>
      </div>
    );
  }

  return (
    <div className='approval-grid'>
      {/* Header with controls */}
      <div className='approval-grid-header'>
        <div className='header-left'>
          <h2>Creative Review</h2>
          <span className='asset-count'>{filteredItems.length} captions</span>
        </div>

        <div className='header-controls'>
          {/* Auto-approve button */}
          <button
            onClick={handleAutoApprove}
            className='btn btn-auto-approve'
            title='Automatically approve captions with quality score >= 8'
          >
            ⚡ Auto-Approve Best
          </button>

          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className='filter-select'
          >
            <option value='all'>All Captions</option>
            <option value='pending'>Pending</option>
            <option value='approved'>Approved</option>
            <option value='rejected'>Rejected</option>
          </select>

          {/* Select all */}
          <label className='select-all'>
            <input
              type='checkbox'
              checked={
                selectedIds.length === filteredItems.length &&
                filteredItems.length > 0
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            Select All
          </label>
        </div>
      </div>

      {/* Batch actions */}
      {selectedIds.length > 0 && (
        <div className='batch-actions'>
          <span className='selected-count'>{selectedIds.length} selected</span>
          <div className='action-buttons'>
            <button
              onClick={() => handleApprove(selectedIds)}
              className='btn btn-approve'
            >
              Approve ({selectedIds.length})
            </button>
            <button
              onClick={() => handleReject(selectedIds)}
              className='btn btn-reject'
            >
              Reject ({selectedIds.length})
            </button>
            {approvedCount >= 1 && (
              <button
                onClick={() => setShowExportModal(true)}
                className='btn btn-export'
              >
                Export Approved ({approvedCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid of items */}
      <div className='approval-grid-container'>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`approval-item ${item.approvalStatus} ${
              selectedIds.includes(item.id) ? 'selected' : ''
            }`}
          >
            {/* Selection checkbox */}
            <div className='item-select'>
              <input
                type='checkbox'
                checked={selectedIds.includes(item.id)}
                onChange={(e) => handleSelect(item.id, e.target.checked)}
              />
            </div>

            {/* Status indicator */}
            <div
              className='item-status'
              style={{ backgroundColor: getStatusColor(item.approvalStatus) }}
            >
              {getStatusIcon(item.approvalStatus)}
            </div>

            {/* Quality score badge */}
            {item.qualityScore && (
              <div
                className={`quality-badge score-${item.qualityScore}`}
                title={`Quality Score: ${item.qualityScore}/10`}
              >
                {item.qualityScore}
              </div>
            )}

            {/* Asset preview */}
            <div className='item-preview'>
              {item.asset?.url ? (
                <img
                  src={item.asset.thumbnailUrl || item.asset.url}
                  alt={item.text}
                  className='preview-image'
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <div className='preview-placeholder'>
                  <span>No Image</span>
                </div>
              )}
              <div className='preview-overlay'>
                <span className='format-label'>
                  {item.asset?.mimeType || 'image'}
                </span>
              </div>
            </div>

            {/* Caption text */}
            <div className='item-content'>
              {editingId === item.id ? (
                <div className='inline-editor'>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className='edit-textarea'
                    autoFocus
                    rows={4}
                  />
                  <div className='editor-actions'>
                    <button onClick={saveEdit} className='btn-small btn-save'>
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className='btn-small btn-cancel'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className='text-field caption-text'
                  onClick={() => startEditing(item.id, item.text)}
                  title='Click to edit caption'
                >
                  {item.text || 'Add caption text'}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className='item-actions'>
              <button
                onClick={() => handleApprove([item.id])}
                className='btn-small btn-approve'
                disabled={item.approvalStatus === 'approved'}
                title='Approve'
              >
                ✓
              </button>
              <button
                onClick={() => handleReject([item.id])}
                className='btn-small btn-reject'
                disabled={item.approvalStatus === 'rejected'}
                title='Reject'
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Approval progress footer */}
      {items.length > 0 && (
        <div className='approval-footer'>
          <div className='progress-label'>
            Approved: <strong>{approvedCount}</strong> / Target:{' '}
            <strong>{targetCount}</strong>
          </div>
          <div className='progress-bar-container'>
            <div
              className='progress-bar-fill'
              style={{
                width: `${Math.min((approvedCount / targetCount) * 100, 100)}%`,
                backgroundColor:
                  approvedCount >= targetCount ? '#10b981' : '#3b82f6',
              }}
            />
          </div>
          {approvedCount >= targetCount && (
            <div className='progress-message success'>
              ✓ Target reached! Ready to export.
            </div>
          )}
          {approvedCount >= 1 && approvedCount < targetCount && (
            <div className='progress-message'>
              {targetCount - approvedCount} more needed to reach target
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {filteredItems.length === 0 && !loading && (
        <div className='empty-state'>
          <div className='empty-icon'>📁</div>
          <h3>No captions found</h3>
          <p>
            {filter === 'all'
              ? "Generate some captions first, then they'll appear here for review."
              : `No ${filter} captions to display.`}
          </p>
        </div>
      )}

      {/* Export modal */}
      {showExportModal && (
        <ExportModal
          workspaceId={workspaceId}
          onClose={() => setShowExportModal(false)}
          onComplete={(job) => {
            console.log('Export completed:', job);
            setShowExportModal(false);
            // Optionally call parent onExport handler
            if (onExport) {
              onExport(items.filter((i) => i.approved).map((i) => i.id));
            }
          }}
        />
      )}
    </div>
  );
}

export default ApprovalGrid;
