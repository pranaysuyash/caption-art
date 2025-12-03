/**
 * AssetManager - Upload and manage assets for campaigns
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { creativeEngineClient } from '../lib/api/creativeEngineClient';
import { campaignClient } from '../lib/api/campaignClient';
import './AssetManager.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

interface Asset {
  id: string;
  workspaceId: string;
  campaignId?: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export function AssetManager() {
  const { activeWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<'caption' | 'ad-copy'>(
    'caption'
  );
  const [selectedPlatform, setSelectedPlatform] = useState<
    'ig-feed' | 'fb-feed' | 'li-feed'
  >('ig-feed');
  const [variationCount, setVariationCount] = useState(3);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadAssets();
      loadCampaigns();
    }
  }, [activeWorkspace]);

  const loadAssets = async () => {
    if (!activeWorkspace) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/assets?workspaceId=${activeWorkspace.id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!activeWorkspace) return;

    try {
      const data = await campaignClient.getCampaigns(activeWorkspace.id);
      setCampaigns(data || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length > 10) {
        setError('Maximum 10 files can be uploaded at once');
        return;
      }
      if (assets.length + files.length > 20) {
        setError(
          `Cannot upload ${files.length} files. Maximum 20 assets allowed. Currently have ${assets.length}.`
        );
        return;
      }
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || !activeWorkspace) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('workspaceId', activeWorkspace.id);

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/assets/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      await loadAssets();
      setSelectedFiles(null);

      // Reset file input
      const fileInput = document.getElementById(
        'file-input'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!activeWorkspace || assets.length === 0) return;

    try {
      setGenerating(true);
      setError(null);
      setSuccessMessage(null);

      // Get brandKitId from workspace (assuming first brand kit for now)
      // In production, this would come from campaign or user selection
      const token = localStorage.getItem('authToken');
      const brandKitResponse = await fetch(
        `${API_URL}/brand-kits?workspaceId=${activeWorkspace.id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      let brandKitId: string | null = null;
      if (brandKitResponse.ok) {
        const brandKitData = await brandKitResponse.json();
        if (brandKitData.brandKits && brandKitData.brandKits.length > 0) {
          brandKitId = brandKitData.brandKits[0].id;
        }
      }

      if (!brandKitId) {
        throw new Error('No brand kit found. Please create a brand kit first.');
      }

      // Get reference captions from selected campaign
      let referenceCaptions: string[] | undefined;
      let learnedStyleProfile: string | undefined;
      if (selectedCampaignId) {
        try {
          const campaign = await campaignClient.getCampaign(selectedCampaignId);
          referenceCaptions = campaign.referenceCaptions;
          learnedStyleProfile = campaign.learnedStyleProfile;
        } catch (err) {
          console.warn('Failed to load campaign reference captions:', err);
        }
      }

      const result = await creativeEngineClient.startGeneration({
        workspaceId: activeWorkspace.id,
        brandKitId,
        sourceAssets: assets.map((a) => a.id),
        outputCount: variationCount, // N variations per asset
        mode: generationMode, // caption or ad-copy
        platforms: [selectedPlatform], // platform-specific optimization
        referenceCaptions,
        learnedStyleProfile,
      });

      if (result.success) {
        const totalVariations = result.result.summary.totalGenerated;
        const perAsset = Math.floor(totalVariations / assets.length);
        setSuccessMessage(
          `Generated ${totalVariations} captions (${perAsset} per asset) in ${result.result.summary.processingTime}ms. Check the Approval tab!`
        );

        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Caption generation failed'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (!activeWorkspace) {
    return <div className='asset-manager-empty'>No workspace selected</div>;
  }

  return (
    <div className='asset-manager'>
      <div className='asset-manager-header'>
        <div>
          <h2>Assets</h2>
          <p className='asset-count'>{assets.length} / 20 assets</p>
        </div>
        <div className='header-actions'>
          {assets.length > 0 && (
            <>
              <div
                className='campaign-selector'
                style={{ marginRight: '12px' }}
              >
                <label
                  htmlFor='campaign-select'
                  style={{ fontSize: '13px', marginRight: '6px' }}
                >
                  Campaign:
                </label>
                <select
                  id='campaign-select'
                  value={selectedCampaignId || ''}
                  onChange={(e) =>
                    setSelectedCampaignId(e.target.value || null)
                  }
                  disabled={generating}
                  style={{ minWidth: '150px' }}
                >
                  <option value=''>None (no style learning)</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                      {campaign.referenceCaptions &&
                        campaign.referenceCaptions.length > 0 &&
                        ' ✓'}
                    </option>
                  ))}
                </select>
              </div>
              <div className='mode-toggle'>
                <button
                  className={generationMode === 'caption' ? 'active' : ''}
                  onClick={() => setGenerationMode('caption')}
                  disabled={generating}
                >
                  Caption
                </button>
                <button
                  className={generationMode === 'ad-copy' ? 'active' : ''}
                  onClick={() => setGenerationMode('ad-copy')}
                  disabled={generating}
                >
                  Ad Copy
                </button>
              </div>
              <div className='variation-selector'>
                <label htmlFor='variation-count'>Variations:</label>
                <select
                  id='variation-count'
                  value={variationCount}
                  onChange={(e) => setVariationCount(Number(e.target.value))}
                  disabled={generating}
                >
                  <option value={1}>1 option</option>
                  <option value={2}>2 options</option>
                  <option value={3}>3 options</option>
                  <option value={5}>5 options</option>
                  <option value={10}>10 options</option>
                </select>
              </div>
              <div className='platform-selector'>
                <label htmlFor='platform-select'>Platform:</label>
                <select
                  id='platform-select'
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as any)}
                  disabled={generating}
                >
                  <option value='ig-feed'>Instagram</option>
                  <option value='fb-feed'>Facebook</option>
                  <option value='li-feed'>LinkedIn</option>
                </select>
              </div>
            </>
          )}
          <label htmlFor='file-input' className='btn-upload'>
            + Upload Assets
            <input
              id='file-input'
              type='file'
              multiple
              accept='image/*,video/*'
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
          {assets.length > 0 && (
            <button
              onClick={handleGenerateCaptions}
              className='btn-generate'
              disabled={loading || generating}
            >
              {generating ? 'Generating...' : 'Generate Captions'}
            </button>
          )}
        </div>
      </div>

      {error && <div className='error-message'>{error}</div>}
      {successMessage && (
        <div className='success-message'>{successMessage}</div>
      )}

      {selectedFiles && selectedFiles.length > 0 && (
        <div className='upload-preview'>
          <div className='upload-info'>
            <span>{selectedFiles.length} files selected</span>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className='btn-confirm-upload'
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className='asset-grid-loading'>Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className='asset-grid-empty'>
          <div className='empty-icon'>🖼️</div>
          <h3>No assets uploaded</h3>
          <p>Upload images or videos to generate captions</p>
        </div>
      ) : (
        <div className='asset-grid'>
          {assets.map((asset) => (
            <div key={asset.id} className='asset-card'>
              {asset.mimeType.startsWith('image/') ? (
                <img
                  src={asset.thumbnailUrl || asset.url}
                  alt={asset.originalName}
                  className='asset-preview'
                />
              ) : (
                <video
                  src={asset.url}
                  className='asset-preview'
                  controls={false}
                />
              )}
              <div className='asset-info'>
                <div className='asset-name' title={asset.originalName}>
                  {asset.originalName}
                </div>
                <div className='asset-meta'>
                  {(asset.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
