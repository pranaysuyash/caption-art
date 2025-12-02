/**
 * ReferenceCreativeManager - Upload and manage reference creatives
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import './ReferenceCreativeManager.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

interface ReferenceCreative {
  id: string;
  workspaceId: string;
  campaignId?: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  notes?: string;
  createdAt: string;
}

export function ReferenceCreativeManager() {
  const { activeWorkspace } = useWorkspace();
  const [references, setReferences] = useState<ReferenceCreative[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    notes: '',
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadReferences();
    }
  }, [activeWorkspace]);

  const loadReferences = async () => {
    if (!activeWorkspace) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/reference-creatives?workspaceId=${activeWorkspace.id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReferences(data.referenceCreatives || []);
      }
    } catch (err) {
      console.error('Failed to load reference creatives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeWorkspace) return;

    try {
      setUploading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/reference-creatives/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          ...uploadForm,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      await loadReferences();
      setShowUploadModal(false);
      setUploadForm({ name: '', notes: '', imageUrl: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className='reference-creative-empty'>No workspace selected</div>
    );
  }

  return (
    <div className='reference-creative-manager'>
      <div className='reference-header'>
        <div>
          <h2>Reference Creatives</h2>
          <p className='reference-count'>{references.length} references</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className='btn-add-reference'
        >
          + Add Reference
        </button>
      </div>

      {loading ? (
        <div className='reference-grid-loading'>Loading references...</div>
      ) : references.length === 0 ? (
        <div className='reference-grid-empty'>
          <div className='empty-icon'>🎨</div>
          <h3>No reference creatives</h3>
          <p>Upload examples to guide caption generation style</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className='btn-add-reference'
          >
            + Add Reference
          </button>
        </div>
      ) : (
        <div className='reference-grid'>
          {references.map((ref) => (
            <div key={ref.id} className='reference-card'>
              <img
                src={ref.thumbnailUrl || ref.imageUrl}
                alt={ref.name}
                className='reference-preview'
              />
              <div className='reference-info'>
                <div className='reference-name'>{ref.name}</div>
                {ref.notes && (
                  <div className='reference-notes'>{ref.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div
          className='modal-overlay'
          onClick={() => setShowUploadModal(false)}
        >
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Add Reference Creative</h2>
              <button
                className='close-button'
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload} className='upload-form'>
              <div className='form-group'>
                <label>Name *</label>
                <input
                  type='text'
                  value={uploadForm.name}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, name: e.target.value })
                  }
                  required
                  placeholder='Example Ad Name'
                />
              </div>

              <div className='form-group'>
                <label>Image URL *</label>
                <input
                  type='url'
                  value={uploadForm.imageUrl}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, imageUrl: e.target.value })
                  }
                  required
                  placeholder='https://example.com/image.jpg'
                />
              </div>

              <div className='form-group'>
                <label>Notes</label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, notes: e.target.value })
                  }
                  placeholder='What makes this creative effective?'
                  rows={4}
                />
              </div>

              {error && <div className='error-message'>{error}</div>}

              <div className='modal-actions'>
                <button
                  type='button'
                  onClick={() => setShowUploadModal(false)}
                  className='btn-secondary'
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn-primary'
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Add Reference'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
