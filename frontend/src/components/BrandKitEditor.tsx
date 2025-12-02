/**
 * BrandKitEditor - Edit brand kit for workspace
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  brandKitClient,
  BrandKit,
  UpdateBrandKitData,
} from '../lib/api/brandKitClient';
import './BrandKitEditor.css';

const FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Inter',
];

export function BrandKitEditor() {
  const { activeWorkspace } = useWorkspace();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateBrandKitData>({
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      tertiary: '#cccccc',
    },
    fonts: {
      heading: 'Arial',
      body: 'Arial',
    },
    voicePrompt: '',
  });

  useEffect(() => {
    if (activeWorkspace) {
      loadBrandKit();
    }
  }, [activeWorkspace]);

  const loadBrandKit = async () => {
    if (!activeWorkspace) return;

    try {
      setLoading(true);
      // For V1, assume brandKitId matches workspaceId or fetch from workspace
      const kit = await brandKitClient.getBrandKit(activeWorkspace.id);
      setBrandKit(kit);
      setFormData({
        colors: kit.colors,
        fonts: kit.fonts,
        voicePrompt: kit.voicePrompt,
      });
    } catch (err) {
      console.error('Failed to load brand kit:', err);
      setError('Brand kit not found. Create one first.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandKit) return;

    try {
      setSaving(true);
      setError(null);
      await brandKitClient.updateBrandKit(brandKit.id, formData);
      await loadBrandKit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand kit');
    } finally {
      setSaving(false);
    }
  };

  if (!activeWorkspace) {
    return <div className='brand-kit-empty'>No workspace selected</div>;
  }

  if (loading) {
    return <div className='brand-kit-loading'>Loading brand kit...</div>;
  }

  if (error && !brandKit) {
    return (
      <div className='brand-kit-error'>
        <div className='error-icon'>⚠️</div>
        <h3>Brand Kit Not Found</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className='brand-kit-editor'>
      <div className='editor-header'>
        <h2>Brand Kit</h2>
        <span className='workspace-label'>{activeWorkspace.clientName}</span>
      </div>

      <form onSubmit={handleSave} className='brand-kit-form'>
        {/* Colors Section */}
        <div className='form-section'>
          <h3>Brand Colors</h3>
          <div className='color-inputs'>
            <div className='color-input-group'>
              <label>Primary Color</label>
              <div className='color-input-wrapper'>
                <input
                  type='color'
                  value={formData.colors?.primary || '#000000'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: { ...formData.colors!, primary: e.target.value },
                    })
                  }
                />
                <input
                  type='text'
                  value={formData.colors?.primary || '#000000'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: { ...formData.colors!, primary: e.target.value },
                    })
                  }
                  placeholder='#000000'
                />
              </div>
            </div>

            <div className='color-input-group'>
              <label>Secondary Color</label>
              <div className='color-input-wrapper'>
                <input
                  type='color'
                  value={formData.colors?.secondary || '#ffffff'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: {
                        ...formData.colors!,
                        secondary: e.target.value,
                      },
                    })
                  }
                />
                <input
                  type='text'
                  value={formData.colors?.secondary || '#ffffff'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: {
                        ...formData.colors!,
                        secondary: e.target.value,
                      },
                    })
                  }
                  placeholder='#ffffff'
                />
              </div>
            </div>

            <div className='color-input-group'>
              <label>Tertiary Color</label>
              <div className='color-input-wrapper'>
                <input
                  type='color'
                  value={formData.colors?.tertiary || '#cccccc'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: { ...formData.colors!, tertiary: e.target.value },
                    })
                  }
                />
                <input
                  type='text'
                  value={formData.colors?.tertiary || '#cccccc'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: { ...formData.colors!, tertiary: e.target.value },
                    })
                  }
                  placeholder='#cccccc'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fonts Section */}
        <div className='form-section'>
          <h3>Typography</h3>
          <div className='font-inputs'>
            <div className='form-group'>
              <label>Heading Font</label>
              <select
                value={formData.fonts?.heading || 'Arial'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fonts: { ...formData.fonts!, heading: e.target.value },
                  })
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className='form-group'>
              <label>Body Font</label>
              <select
                value={formData.fonts?.body || 'Arial'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fonts: { ...formData.fonts!, body: e.target.value },
                  })
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Voice & Tone Section */}
        <div className='form-section'>
          <h3>Voice & Tone</h3>
          <div className='form-group'>
            <label>Brand Voice Instructions</label>
            <textarea
              value={formData.voicePrompt || ''}
              onChange={(e) =>
                setFormData({ ...formData, voicePrompt: e.target.value })
              }
              placeholder='Describe your brand voice, tone, and style guidelines...'
              rows={6}
              maxLength={500}
            />
            <div className='char-count'>
              {formData.voicePrompt?.length || 0} / 500
            </div>
          </div>
        </div>

        {error && <div className='error-message'>{error}</div>}

        <div className='form-actions'>
          <button type='submit' className='btn-save' disabled={saving}>
            {saving ? 'Saving...' : 'Save Brand Kit'}
          </button>
        </div>
      </form>
    </div>
  );
}
