/**
 * CreateCampaignModal - Modal for creating new campaigns
 */

import { useState, useEffect } from 'react';
import {
  campaignClient,
  CreateCampaignData,
  CampaignObjective,
  LaunchType,
  FunnelStage,
  Placement,
} from '../lib/api/campaignClient';
import './CreateCampaignModal.css';

interface CreateCampaignModalProps {
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCampaignModal({
  workspaceId,
  onClose,
  onCreated,
}: CreateCampaignModalProps) {
  const [formData, setFormData] = useState<CreateCampaignData>({
    workspaceId,
    name: '',
    description: '',
    brandKitId: undefined,
    objective: 'awareness',
    launchType: 'new-launch',
    funnelStage: 'cold',
    primaryOffer: '',
    primaryCTA: '',
    secondaryCTA: '',
    targetAudience: '',
    placements: ['ig-feed'],
    referenceCaptions: [],
    keywords: [],
    mustIncludePhrases: [],
    mustExcludePhrases: [],
    headlineMaxLength: undefined,
    bodyMaxLength: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newReferenceCaption, setNewReferenceCaption] = useState('');
  const [workspaceBrandKit, setWorkspaceBrandKit] = useState<{
    id: string;
    name?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      // Ensure required fields are present; add defaults if omitted
      const payload: CreateCampaignData = {
        ...formData,
        workspaceId: formData.workspaceId || workspaceId,
        launchType: formData.launchType || 'new-launch',
        funnelStage: formData.funnelStage || 'cold',
        callToAction: formData.primaryCTA || undefined,
        placements:
          formData.placements && formData.placements.length
            ? formData.placements
            : ['ig-feed'],
        keywords: (formData.keywords || []).filter(Boolean),
        mustIncludePhrases: (formData.mustIncludePhrases || []).filter(Boolean),
        mustExcludePhrases: (formData.mustExcludePhrases || []).filter(Boolean),
      };

      if (!payload.workspaceId) {
        setError('Workspace required to create a campaign');
        setLoading(false);
        return;
      }

      await campaignClient.createCampaign(payload);
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create campaign'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadBrandKit = async () => {
      if (!workspaceId) return;
      try {
        const resp = await fetch(
          `${
            import.meta.env.VITE_API_BASE || 'http://localhost:3001'
          }/api/brand-kits/workspace/${workspaceId}`,
          { credentials: 'include' }
        );
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.brandKit) {
          setWorkspaceBrandKit({
            id: data.brandKit.id,
            name: data.brandKit.name || '',
          });
          setFormData((f) => ({ ...f, brandKitId: data.brandKit.id }));
        }
      } catch (err) {
        // ignore
      }
    };
    loadBrandKit();
  }, [workspaceId]);

  const togglePlacement = (placement: Placement) => {
    setFormData((prev) => ({
      ...prev,
      placements: prev.placements.includes(placement)
        ? prev.placements.filter((p) => p !== placement)
        : [...prev.placements, placement],
    }));
  };

  const addReferenceCaption = () => {
    if (newReferenceCaption.trim()) {
      setFormData((prev) => ({
        ...prev,
        referenceCaptions: [
          ...(prev.referenceCaptions || []),
          newReferenceCaption.trim(),
        ],
      }));
      setNewReferenceCaption('');
    }
  };

  const removeReferenceCaption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      referenceCaptions: prev.referenceCaptions?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>Create Campaign</h2>
          <button className='close-button' onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className='campaign-form'>
          <div className='form-group'>
            <label>Campaign Name *</label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder='Summer Sale 2024'
            />
          </div>

          <div className='form-group'>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Campaign goals and details...'
              rows={3}
            />
          </div>

          <div className='form-group'>
            <label>Brand Kit</label>
            <select
              value={formData.brandKitId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  brandKitId: e.target.value || undefined,
                })
              }
            >
              <option value=''>Default from workspace</option>
              {workspaceBrandKit && (
                <option value={workspaceBrandKit.id}>
                  {workspaceBrandKit.name || workspaceBrandKit.id}
                </option>
              )}
            </select>
            <small style={{ display: 'block', marginTop: '4px', opacity: 0.7 }}>
              Select a brand kit to attach to this campaign. If none selected,
              workspace's default will be used.
            </small>
          </div>

          <div className='form-row'>
            <div className='form-group'>
              <label htmlFor='objective-select'>Objective *</label>
              <select
                id='objective-select'
                value={formData.objective}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    objective: e.target.value as CampaignObjective,
                  })
                }
                required
              >
                <option value='awareness'>Awareness</option>
                <option value='traffic'>Traffic</option>
                <option value='conversion'>Conversion</option>
                <option value='engagement'>Engagement</option>
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='launchtype-select'>Launch Type *</label>
              <select
                id='launchtype-select'
                value={formData.launchType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    launchType: e.target.value as LaunchType,
                  })
                }
                required
              >
                <option value='new-launch'>New Launch</option>
                <option value='evergreen'>Evergreen</option>
                <option value='seasonal'>Seasonal</option>
                <option value='sale'>Sale</option>
                <option value='event'>Event</option>
              </select>
            </div>
          </div>

          <div className='form-group'>
            <label>Funnel Stage *</label>
            <div className='radio-group'>
              {(['cold', 'warm', 'hot'] as FunnelStage[]).map((stage) => (
                <label key={stage} className='radio-label'>
                  <input
                    type='radio'
                    value={stage}
                    checked={formData.funnelStage === stage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        funnelStage: e.target.value as FunnelStage,
                      })
                    }
                  />
                  <span className='capitalize'>{stage}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='form-group'>
            <label>Placements *</label>
            <div className='checkbox-group'>
              {[
                { value: 'ig-feed', label: 'Instagram Feed' },
                { value: 'ig-story', label: 'Instagram Story' },
                { value: 'fb-feed', label: 'Facebook Feed' },
                { value: 'fb-story', label: 'Facebook Story' },
                { value: 'li-feed', label: 'LinkedIn Feed' },
              ].map(({ value, label }) => (
                <label key={value} className='checkbox-label'>
                  <input
                    type='checkbox'
                    checked={formData.placements.includes(value as Placement)}
                    onChange={() => togglePlacement(value as Placement)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className='form-group'>
            <label>Primary CTA</label>
            <input
              type='text'
              value={formData.primaryCTA}
              onChange={(e) =>
                setFormData({ ...formData, primaryCTA: e.target.value })
              }
              placeholder='Shop Now, Learn More, etc.'
            />
          </div>

          <div className='form-group'>
            <label>Secondary CTA</label>
            <input
              type='text'
              value={formData.secondaryCTA}
              onChange={(e) =>
                setFormData({ ...formData, secondaryCTA: e.target.value })
              }
              placeholder='Optional backup CTA'
            />
          </div>

          <div className='form-group'>
            <label>Primary Offer</label>
            <input
              type='text'
              value={formData.primaryOffer}
              onChange={(e) =>
                setFormData({ ...formData, primaryOffer: e.target.value })
              }
              placeholder='20% off summer collection, New drop, etc.'
            />
          </div>

          <div className='form-group'>
            <label>Target Audience</label>
            <input
              type='text'
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value })
              }
              placeholder='Eg. Women 25-35, urban, fitness-focused'
            />
          </div>

          <div className='form-row'>
            <div className='form-group'>
              <label>Headline Max Length</label>
              <input
                type='number'
                min={20}
                max={200}
                value={formData.headlineMaxLength || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    headlineMaxLength: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder='e.g., 80'
              />
            </div>
            <div className='form-group'>
              <label>Body Max Length</label>
              <input
                type='number'
                min={40}
                max={1000}
                value={formData.bodyMaxLength || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bodyMaxLength: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder='e.g., 220'
              />
            </div>
          </div>

          <div className='form-group'>
            <label>Keywords (comma-separated)</label>
            <input
              type='text'
              value={(formData.keywords || []).join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  keywords: e.target.value
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean),
                })
              }
              placeholder='eco-friendly, breathable fabric, limited drop'
            />
          </div>

          <div className='form-group'>
            <label>Must Include Phrases</label>
            <textarea
              value={(formData.mustIncludePhrases || []).join('\n')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mustIncludePhrases: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder={
                'One phrase per line\nBrand name must appear\nAlways mention free shipping'
              }
              rows={3}
            />
          </div>

          <div className='form-group'>
            <label>Must Exclude Phrases</label>
            <textarea
              value={(formData.mustExcludePhrases || []).join('\n')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mustExcludePhrases: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder={
                'One phrase per line\nNo discounts language\nAvoid jargon'
              }
              rows={3}
            />
          </div>

          <div className='form-group'>
            <label>
              Reference Captions (Optional)
              <small
                style={{ display: 'block', marginTop: '4px', opacity: 0.7 }}
              >
                Add example captions to teach the AI your brand's writing style.
                The AI will analyze tone, vocabulary, emoji usage, and hashtag
                patterns.
              </small>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type='text'
                value={newReferenceCaption}
                onChange={(e) => setNewReferenceCaption(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), addReferenceCaption())
                }
                placeholder='Paste a caption that matches your brand voice...'
                style={{ flex: 1 }}
              />
              <button
                type='button'
                onClick={addReferenceCaption}
                className='btn btn-secondary btn-sm'
                disabled={!newReferenceCaption.trim()}
              >
                Add
              </button>
            </div>
            {formData.referenceCaptions &&
              formData.referenceCaptions.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      marginBottom: '8px',
                      opacity: 0.7,
                    }}
                  >
                    {formData.referenceCaptions.length} reference caption
                    {formData.referenceCaptions.length !== 1 ? 's' : ''} added
                    {formData.referenceCaptions.length >= 2 && ' ✓'}
                    {formData.referenceCaptions.length === 1 &&
                      ' (add at least 1 more for style analysis)'}
                  </div>
                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {formData.referenceCaptions.map((caption, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px',
                          background: '#f5f5f5',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            fontSize: '13px',
                            lineHeight: '1.5',
                          }}
                        >
                          {caption}
                        </div>
                        <button
                          type='button'
                          onClick={() => removeReferenceCaption(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            opacity: 0.5,
                            padding: '0 4px',
                          }}
                          title='Remove'
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {error && <div className='error-message'>{error}</div>}

          <div className='modal-actions'>
            <button
              type='button'
              onClick={onClose}
              className='btn btn-secondary'
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='btn btn-primary'
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
