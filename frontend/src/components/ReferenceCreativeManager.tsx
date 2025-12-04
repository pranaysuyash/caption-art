/**
 * ReferenceCreativeManager V2 - Upload and manage reference creatives with style extraction
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import './ReferenceCreativeManager.css';
import apiFetch from '../lib/api/httpClient';
import { safeLocalStorage } from '../lib/storage/safeLocalStorage';

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

  // V2 Style Analysis fields
  extractedColors?: string[];
  detectedLayout?: 'center-focus' | 'bottom-text' | 'top-text' | 'split';
  textDensity?: 'minimal' | 'moderate' | 'heavy';
  styleTags?: string[]; // ['high-contrast', 'bold-typography', 'minimal']

  createdAt: string;
}

interface StyleAnalysis {
  extractedColors: string[];
  detectedLayout: 'center-focus' | 'bottom-text' | 'top-text' | 'split';
  textDensity: 'minimal' | 'moderate' | 'heavy';
  styleTags: string[];
  dominantColors: string[];
  colorPalette: string[];
  composition: string;
  typography: string;
  visualElements: string[];
}

export function ReferenceCreativeManager() {
  const { activeWorkspace } = useWorkspace();
  const [references, setReferences] = useState<ReferenceCreative[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    notes: '',
    imageUrl: '',
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] =
    useState<ReferenceCreative | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      loadReferences();
    }
  }, [activeWorkspace]);

  const loadReferences = async () => {
    if (!activeWorkspace) return;

    try {
      setLoading(true);
      const response = await apiFetch(
        `${API_URL}/reference-creatives?workspaceId=${activeWorkspace.id}`,
        {
          method: 'GET',
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file,
        name: uploadForm.name || file.name.split('.')[0],
      });
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('workspaceId', activeWorkspace!.id);

    const response = await apiFetch(`${API_URL}/upload`, {
      method: 'POST',
      // apiFetch will include credentials; FormData body should not set Content-Type
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.url;
  };

  const analyzeStyle = async (imageUrl: string): Promise<StyleAnalysis> => {
    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStatus('Analyzing visual elements...');

    try {
      // Simulate style analysis progress
      const steps = [
        { progress: 20, status: 'Extracting color palette...' },
        { progress: 40, status: 'Detecting layout patterns...' },
        { progress: 60, status: 'Analyzing text density...' },
        { progress: 80, status: 'Identifying style characteristics...' },
        { progress: 95, status: 'Generating style tags...' },
        { progress: 100, status: 'Analysis complete!' },
      ];

      for (const step of steps) {
        setAnalysisProgress(step.progress);
        setAnalysisStatus(step.status);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Call style analysis API
      const response = await apiFetch(`${API_URL}/analyze-style`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Style analysis failed');
      }

      const analysis: StyleAnalysis = await response.json();
      return analysis;
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStatus('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeWorkspace) return;

    try {
      setUploading(true);
      setError(null);

      let imageUrl = uploadForm.imageUrl;

      // If file is provided, upload it first
      if (uploadForm.file) {
        imageUrl = await uploadFile(uploadForm.file);
      }

      // Analyze style
      const styleAnalysis = await analyzeStyle(imageUrl);

      // Create reference creative with analysis
      const response = await apiFetch(`${API_URL}/reference-creatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // apiFetch will include credentials
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          name: uploadForm.name,
          imageUrl,
          notes: uploadForm.notes,
          ...styleAnalysis,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      await loadReferences();
      setShowUploadModal(false);
      setUploadForm({ name: '', notes: '', imageUrl: '', file: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleViewStyle = (reference: ReferenceCreative) => {
    setSelectedReference(reference);
    setShowStyleModal(true);
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
          <h2>🎨 Reference Creatives</h2>
          <p className='reference-count'>
            {references.length} reference{references.length !== 1 ? 's' : ''}
          </p>
          <p className='reference-description'>
            Upload examples to guide AI style learning and creative generation
          </p>
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
          <p>
            Upload examples to guide AI style learning and caption generation
          </p>
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
            <div key={ref.id} className='reference-card enhanced'>
              <div className='reference-image-container'>
                <img
                  src={ref.thumbnailUrl || ref.imageUrl}
                  alt={ref.name}
                  className='reference-preview'
                />
                <div className='reference-overlay'>
                  <button
                    onClick={() => handleViewStyle(ref)}
                    className='btn-view-style'
                    title='View style analysis'
                  >
                    <span>🔍</span> Style
                  </button>
                </div>
              </div>
              <div className='reference-info'>
                <div className='reference-name'>{ref.name}</div>
                {ref.notes && (
                  <div className='reference-notes'>{ref.notes}</div>
                )}

                {/* V2 Style Analysis Display */}
                {ref.styleTags && ref.styleTags.length > 0 && (
                  <div className='reference-style-tags'>
                    {ref.styleTags.slice(0, 3).map((tag, index) => (
                      <span key={index} className='style-tag'>
                        {tag}
                      </span>
                    ))}
                    {ref.styleTags.length > 3 && (
                      <span className='style-tag more'>
                        +{ref.styleTags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className='reference-analysis'>
                  {ref.detectedLayout && (
                    <span className='analysis-item layout'>
                      Layout: {ref.detectedLayout.replace('-', ' ')}
                    </span>
                  )}
                  {ref.textDensity && (
                    <span className='analysis-item density'>
                      Text: {ref.textDensity}
                    </span>
                  )}
                  {ref.extractedColors && ref.extractedColors.length > 0 && (
                    <div className='analysis-item colors'>
                      Colors:
                      <div className='color-swatches'>
                        {ref.extractedColors.slice(0, 4).map((color, index) => (
                          <span
                            key={index}
                            className='color-swatch'
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className='modal-overlay'
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className='modal-content enhanced'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='modal-header'>
              <div>
                <h2>🎨 Add Reference Creative</h2>
                <p>
                  Upload an image to analyze and learn its style characteristics
                </p>
              </div>
              <button
                className='close-button'
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload} className='upload-form enhanced'>
              <div className='form-group'>
                <label>Reference Name *</label>
                <input
                  type='text'
                  value={uploadForm.name}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, name: e.target.value })
                  }
                  required
                  placeholder='Example: Summer Campaign Ad'
                />
                <small>
                  Give this reference a descriptive name for easy identification
                </small>
              </div>

              <div className='form-group'>
                <label>Upload Image</label>
                <div className='file-upload-area'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    id='reference-file-input'
                    className='file-input'
                  />
                  <label
                    htmlFor='reference-file-input'
                    className='file-upload-label'
                  >
                    {uploadForm.file ? (
                      <div className='file-selected'>
                        <span className='file-icon'>📷</span>
                        <span className='file-name'>
                          {uploadForm.file.name}
                        </span>
                      </div>
                    ) : (
                      <div className='file-prompt'>
                        <span className='upload-icon'>☁️</span>
                        <span>Click to upload or drag and drop</span>
                        <small>PNG, JPG, GIF up to 10MB</small>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className='form-group'>
                <label>Or Image URL</label>
                <input
                  type='url'
                  value={uploadForm.imageUrl}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, imageUrl: e.target.value })
                  }
                  placeholder='https://example.com/image.jpg'
                />
                <small>Upload a file or provide an image URL</small>
              </div>

              <div className='form-group'>
                <label>Analysis Notes</label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, notes: e.target.value })
                  }
                  placeholder='What makes this creative effective? Any specific elements to learn from?'
                  rows={4}
                />
                <small>
                  Describe what elements should be learned from this reference
                  (colors, typography, layout, etc.)
                </small>
              </div>

              {analyzing && (
                <div className='analysis-progress'>
                  <div className='analysis-status'>{analysisStatus}</div>
                  <div className='progress-bar'>
                    <div
                      className='progress-fill'
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && <div className='error-message'>{error}</div>}

              <div className='modal-actions'>
                <button
                  type='button'
                  onClick={() => setShowUploadModal(false)}
                  className='btn-secondary'
                  disabled={uploading || analyzing}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn-primary'
                  disabled={
                    uploading ||
                    analyzing ||
                    (!uploadForm.file && !uploadForm.imageUrl)
                  }
                >
                  {uploading
                    ? 'Uploading...'
                    : analyzing
                    ? 'Analyzing...'
                    : 'Add Reference'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Style Analysis Modal */}
      {showStyleModal && selectedReference && (
        <div className='modal-overlay' onClick={() => setShowStyleModal(false)}>
          <div
            className='modal-content style-modal'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='modal-header'>
              <div>
                <h2>🔍 Style Analysis</h2>
                <p>{selectedReference.name}</p>
              </div>
              <button
                className='close-button'
                onClick={() => setShowStyleModal(false)}
              >
                ×
              </button>
            </div>

            <div className='style-analysis-content'>
              <div className='analysis-preview'>
                <img
                  src={
                    selectedReference.thumbnailUrl || selectedReference.imageUrl
                  }
                  alt={selectedReference.name}
                  className='analysis-image'
                />
              </div>

              <div className='analysis-details'>
                {selectedReference.detectedLayout && (
                  <div className='analysis-section'>
                    <h3>📐 Layout Pattern</h3>
                    <p>{selectedReference.detectedLayout.replace('-', ' ')}</p>
                  </div>
                )}

                {selectedReference.textDensity && (
                  <div className='analysis-section'>
                    <h3>📝 Text Density</h3>
                    <p>{selectedReference.textDensity}</p>
                  </div>
                )}

                {selectedReference.extractedColors &&
                  selectedReference.extractedColors.length > 0 && (
                    <div className='analysis-section'>
                      <h3>🎨 Color Palette</h3>
                      <div className='color-palette'>
                        {selectedReference.extractedColors.map(
                          (color, index) => (
                            <div key={index} className='color-item'>
                              <div
                                className='color-box'
                                style={{ backgroundColor: color }}
                              />
                              <span className='color-code'>{color}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {selectedReference.styleTags &&
                  selectedReference.styleTags.length > 0 && (
                    <div className='analysis-section'>
                      <h3>🏷️ Style Characteristics</h3>
                      <div className='style-tags-grid'>
                        {selectedReference.styleTags.map((tag, index) => (
                          <span key={index} className='style-tag'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedReference.notes && (
                  <div className='analysis-section'>
                    <h3>📝 Notes</h3>
                    <p>{selectedReference.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className='modal-actions'>
              <button
                onClick={() => setShowStyleModal(false)}
                className='btn-primary'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
