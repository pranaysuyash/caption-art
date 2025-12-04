/**
 * CreateCampaignModal - Modal for creating new campaigns
 */

import { useState } from 'react';
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
    name: '',
    description: '',
    brandKitId: workspaceId, // Using workspaceId as placeholder - will need to fetch actual brandKitId
    objective: 'awareness',
    launchType: 'new-launch',
    funnelStage: 'cold',
    primaryCTA: '',
    placements: ['ig-feed'],
    referenceCaptions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newReferenceCaption, setNewReferenceCaption] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      await campaignClient.createCampaign(formData);
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create campaign'
      );
    } finally {
      setLoading(false);
    }
  };

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
                className='btn-secondary'
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
              className='btn-secondary'
              disabled={loading}
            >
              Cancel
            </button>
            <button type='submit' className='btn-primary' disabled={loading}>
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
