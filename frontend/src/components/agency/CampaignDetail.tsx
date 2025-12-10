import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, FileText, ClipboardList } from 'lucide-react';
import { CampaignBriefEditor } from '../CampaignBriefEditor';
import '../CampaignBriefEditor.css';
import apiFetch from '../../lib/api/httpClient';
import { Breadcrumbs } from '../Breadcrumbs';
import { Modal, ModalActions } from '../Modal';
import { AssetUploader } from './AssetUploader';
import { ApprovalGrid } from './ApprovalGrid';
import { useToast } from '../Toast';

export function CampaignDetail() {
  const { workspaceId, campaignId } = useParams<{
    workspaceId: string;
    campaignId: string;
  }>();
  const { success, error: toastError } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'brand-kit' | 'assets' | 'approvals' | 'campaign-brief'
  >('brand-kit');
  const [showBriefEditor, setShowBriefEditor] = useState(false);
  const [maskingModels, setMaskingModels] = useState<string[]>([]);
  const [brandPreviewColors, setBrandPreviewColors] = useState<{
    primary: string;
    secondary: string;
    tertiary: string;
  }>({ primary: '#ff6b6b', secondary: '#38bdf8', tertiary: '#fbbf24' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaignData();
  }, [workspaceId, campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);

      // Fetch Campaign
      const campaignRes = await apiFetch(
        `${
          import.meta.env.VITE_API_BASE || 'http://localhost:3001'
        }/api/campaigns/${campaignId}`,
        { method: 'GET' }
      );
      if (campaignRes.ok) {
        const data = await campaignRes.json();
        setCampaign(data.campaign);

        // Fetch Brand Kit (if campaign has one)
        if (data.campaign.brandKitId) {
          const brandKitRes = await apiFetch(
            `${
              import.meta.env.VITE_API_BASE || 'http://localhost:3001'
            }/api/brand-kits/${data.campaign.brandKitId}`,
            { method: 'GET' }
          );
          if (brandKitRes.ok) {
            const bkData = await brandKitRes.json();
            // Normalize brand kit shape to match editor expectations
            setBrandKit({
              ...bkData.brandKit,
              colors: {
                primary: bkData.brandKit.primaryColor || '#000000',
                secondary: bkData.brandKit.secondaryColor || '#000000',
                tertiary: bkData.brandKit.tertiaryColor || '#000000',
              },
              fonts: {
                heading: bkData.brandKit.headingFont || '',
                body: bkData.brandKit.bodyFont || '',
              },
              logo: bkData.brandKit.logoUrl
                ? {
                    url: bkData.brandKit.logoUrl,
                    position: bkData.brandKit.logoPosition || 'top-left',
                  }
                : undefined,
              preferredPhrases: bkData.brandKit.preferredPhrases
                ? JSON.parse(bkData.brandKit.preferredPhrases)
                : [],
              forbiddenPhrases: bkData.brandKit.forbiddenPhrases
                ? JSON.parse(bkData.brandKit.forbiddenPhrases)
                : [],
              keywords: bkData.brandKit.keywords
                ? JSON.parse(bkData.brandKit.keywords)
                : [],
              values: bkData.brandKit.values
                ? JSON.parse(bkData.brandKit.values)
                : [],
              keyDifferentiators: bkData.brandKit.keyDifferentiators
                ? JSON.parse(bkData.brandKit.keyDifferentiators)
                : [],
              maskingModel: bkData.brandKit.maskingModel || 'rembg-replicate',
            });
            setBrandPreviewColors({
              primary: bkData.brandKit.primaryColor || '#ff6b6b',
              secondary: bkData.brandKit.secondaryColor || '#38bdf8',
              tertiary: bkData.brandKit.tertiaryColor || '#fbbf24',
            });
          }
        }
      }

      // Fetch Assets
      const assetsRes = await apiFetch(
        `${
          import.meta.env.VITE_API_BASE || 'http://localhost:3001'
        }/api/assets?workspaceId=${workspaceId}`,
        { method: 'GET' }
      );
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMaskingModels = async () => {
      try {
        const res = await apiFetch(
          `${
            import.meta.env.VITE_API_BASE || 'http://localhost:3001'
          }/api/brand-kits/masking-models`,
          { method: 'GET' }
        );
        if (!res.ok) return;
        const data = await res.json();
        setMaskingModels(Object.keys(data.models || {}));
      } catch (err) {
        // ignore
      }
    };
    loadMaskingModels();
  }, []);

  const handleSave = async () => {
    if (!campaignId || !brandKit) return;

    try {
      // Update Campaign - send all editable fields
      const campaignUpdateData = {
        name: campaign?.name,
        description: campaign?.description,
        primaryOffer: campaign?.primaryOffer,
        status: campaign?.status,
      };

      await apiFetch(
        `${
          import.meta.env.VITE_API_BASE || 'http://localhost:3001'
        }/api/campaigns/${campaignId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignUpdateData),
        }
      );

      // Update Brand Kit - send all editable fields
      if (brandKit.id) {
        const brandKitUpdateData = {
          // Colors
          primaryColor: brandKit.colors?.primary,
          secondaryColor: brandKit.colors?.secondary,
          tertiaryColor: brandKit.colors?.tertiary,
          // Fonts
          headingFont: brandKit.fonts?.heading,
          bodyFont: brandKit.fonts?.body,
          // Logo
          logoUrl: brandKit.logo?.url,
          logoPosition: brandKit.logo?.position,
          // Voice & Personality
          voicePrompt: brandKit.voicePrompt,
          brandPersonality: brandKit.brandPersonality,
          targetAudience: brandKit.targetAudience,
          valueProposition: brandKit.valueProposition,
          toneStyle: brandKit.toneStyle,
          toneOfVoice: brandKit.toneOfVoice,
          // Phrases & Keywords
          preferredPhrases: JSON.stringify(brandKit.preferredPhrases || []),
          forbiddenPhrases: JSON.stringify(brandKit.forbiddenPhrases || []),
          keywords: JSON.stringify(brandKit.keywords || []),
          values: JSON.stringify(brandKit.values || []),
          keyDifferentiators: JSON.stringify(brandKit.keyDifferentiators || []),
          // Style
          imageryStyle: brandKit.imageryStyle,
          maskingModel: brandKit.maskingModel,
        };

        await apiFetch(
          `${
            import.meta.env.VITE_API_BASE || 'http://localhost:3001'
          }/api/brand-kits/${brandKit.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(brandKitUpdateData),
          }
        );
      }

      success('Campaign data saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      toastError('Failed to save campaign data');
    }
  };

  const handleGenerateOutputs = async () => {
    if (!workspaceId || !campaignId || !brandKit?.id) {
      setGenerationError('Missing required data: workspace, campaign, or brand kit');
      return;
    }

    if (assets.length === 0) {
      setGenerationError('No assets uploaded. Please upload assets first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await apiFetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/creative-engine/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            campaignId,
            brandKitId: brandKit.id,
            sourceAssets: assets.map((asset: any) => ({
              id: asset.id,
              url: asset.url,
              name: asset.originalName || asset.name,
              type: asset.mimeType || asset.type,
            })),
            outputCount: 3,
            generateAdCopy: true,
            generateVariations: true,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        success(`Successfully generated ${result.creatives?.length || 0} outputs!`);
        // Switch to approvals tab to show results
        setActiveTab('approvals');
      } else {
        const error = await response.json();
        setGenerationError(error.error || 'Failed to generate outputs');
      }
    } catch (error) {
      console.error('Error generating outputs:', error);
      setGenerationError('Failed to generate outputs. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const qualityStatus = (score?: number) => {
    if (typeof score !== 'number') {
      return { label: 'Not scored', color: '#94a3b8' };
    }
    if (score >= 85) return { label: 'Excellent', color: '#22c55e' };
    if (score >= 70) return { label: 'Good', color: '#84cc16' };
    if (score >= 50) return { label: 'Review', color: '#f97316' };
    return { label: 'Needs attention', color: '#dc2626' };
  };

  const qualityBreakdown = campaign?.scoreBreakdown
    ? Object.entries(campaign.scoreBreakdown)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .slice(0, 4)
    : [];

  const hasQualityInsights =
    typeof campaign?.qualityScore === 'number' || qualityBreakdown.length > 0;

  if (loading) {
    return (
      <div className='page-container'>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className='card skeleton-card'
              style={{
                padding: '1.5rem',
                border: '1px solid var(--color-border, #1f2937)',
                background: 'var(--color-bg-secondary, #111827)',
              }}
            >
              <div
                className='skeleton-line'
                style={{ width: '60%', height: '16px', marginBottom: '0.75rem' }}
              />
              <div
                className='skeleton-line'
                style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }}
              />
              <div
                className='skeleton-line'
                style={{ width: '75%', height: '14px', marginBottom: '0.5rem' }}
              />
              <div
                className='skeleton-line'
                style={{ width: '50%', height: '14px' }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='page-container'>
      <Breadcrumbs />
      
      <style>
        {`.brand-form-input {
            background: #0d0f12;
            border: 1px solid #2b2f36;
            color: #e5e7eb;
            padding: 0.75rem;
            border-radius: 6px;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .brand-form-input::placeholder {
            color: #94a3b8;
          }
          .brand-form-input:focus {
            outline: none;
            border-color: #7c8cff;
            box-shadow: 0 0 0 2px rgba(124, 140, 255, 0.18);
          }
          .campaign-tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 2rem;
            border-bottom: 2px solid var(--color-border, #e5e7eb);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .campaign-tabs::-webkit-scrollbar {
            display: none;
          }
          .campaign-tab {
            padding: 0.75rem 1.5rem;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            color: var(--color-text-secondary, #6b7280);
            transition: all 0.2s;
            margin-bottom: -2px;
            white-space: nowrap;
            min-width: max-content;
          }
          .campaign-tab:hover {
            color: var(--color-text, #1f2937);
            background: var(--color-bg-secondary, #f3f4f6);
          }
          .campaign-tab-active {
            color: var(--color-primary, #3b82f6);
            border-bottom-color: var(--color-primary, #3b82f6);
          }`}
      </style>
      
      {/* Tab Navigation */}
      <div className="campaign-tabs">
        <button 
          className={`campaign-tab ${activeTab === 'brand-kit' ? 'campaign-tab-active' : ''}`}
          onClick={() => setActiveTab('brand-kit')}
        >
          Brand Kit
        </button>
        <button 
          className={`campaign-tab ${activeTab === 'assets' ? 'campaign-tab-active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          Assets
        </button>
        <button 
          className={`campaign-tab ${activeTab === 'approvals' ? 'campaign-tab-active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          Approvals
        </button>
        <button 
          className={`campaign-tab ${activeTab === 'campaign-brief' ? 'campaign-tab-active' : ''}`}
          onClick={() => setActiveTab('campaign-brief')}
        >
          Campaign Brief
        </button>
      </div>
      {hasQualityInsights && (
        <section
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #e5e7eb)',
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.05))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <p
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary, #6b7280)',
                  margin: 0,
                }}
              >
                Campaign Quality
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1.5rem',
                  color: 'var(--color-text, #0f172a)',
                  margin: '0.25rem 0 0',
                }}
              >
                {campaign?.name}
              </h2>
            </div>
            <div
              style={{
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #0f172a)',
                  lineHeight: 1,
                }}
              >
                {typeof campaign?.qualityScore === 'number'
                  ? Math.round(campaign.qualityScore)
                  : '—'}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: qualityStatus(campaign?.qualityScore).color,
                  fontWeight: 600,
                }}
              >
                {qualityStatus(campaign?.qualityScore).label}
              </div>
            </div>
          </div>
          {qualityBreakdown.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {qualityBreakdown.map(([metric, value]) => (
                <div
                  key={metric}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.65)',
                    borderRadius: '12px',
                    padding: '0.75rem',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      textTransform: 'capitalize',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary, #6b7280)',
                    }}
                  >
                    {metric.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <strong
                    style={{
                      display: 'block',
                      marginTop: '0.25rem',
                      fontSize: '1.1rem',
                      color: 'var(--color-text, #0f172a)',
                    }}
                  >
                    {Math.round(value as number)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Content */}
      {activeTab === 'brand-kit' && (
        <div className='responsive-grid'>
          {/* Brand Kit Editor */}
          <div className='panel'>
            <div className='panel-header'>
              <h3 className='panel-title'>Brand Configuration</h3>
              <button onClick={handleSave} className='btn btn-primary'>
                Save Changes
              </button>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
                >
                  Colors
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      Primary
                    </label>
                    <input
                      type='color'
                      value={brandKit?.colors?.primary || '#000000'}
                      onChange={(e) => {
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            primary: e.target.value,
                          },
                        });
                        setBrandPreviewColors((prev) => ({
                          ...prev,
                          primary: e.target.value,
                        }));
                      }}
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      Secondary
                    </label>
                    <input
                      type='color'
                      value={brandKit?.colors?.secondary || '#000000'}
                      onChange={(e) => {
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            secondary: e.target.value,
                          },
                        });
                        setBrandPreviewColors((prev) => ({
                          ...prev,
                          secondary: e.target.value,
                        }));
                      }}
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      Tertiary
                    </label>
                    <input
                      type='color'
                      value={brandKit?.colors?.tertiary || '#000000'}
                      onChange={(e) => {
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            tertiary: e.target.value,
                          },
                        });
                        setBrandPreviewColors((prev) => ({
                          ...prev,
                          tertiary: e.target.value,
                        }));
                      }}
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  border: '1px solid var(--color-border, #262626)',
                  borderRadius: '12px',
                  background: '#0f1012',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#e5e7eb',
                  }}
                >
                  Live Preview
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      borderRadius: '10px',
                      padding: '0.75rem',
                      background: brandPreviewColors.primary,
                      color: '#0f1012',
                      minHeight: '80px',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Primary</div>
                    <div style={{ opacity: 0.85 }}>
                      Headings & CTA background
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: '10px',
                      padding: '0.75rem',
                      background: brandPreviewColors.secondary,
                      color: '#0f1012',
                      minHeight: '80px',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Secondary</div>
                    <div style={{ opacity: 0.85 }}>
                      Buttons & accents
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: '10px',
                      padding: '0.75rem',
                      background: brandPreviewColors.tertiary,
                      color: '#0f1012',
                      minHeight: '80px',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Tertiary</div>
                    <div style={{ opacity: 0.85 }}>Highlights</div>
                  </div>
                  <div
                    style={{
                      borderRadius: '10px',
                      padding: '0.75rem',
                      background: '#111827',
                      border: '1px solid #1f2937',
                      color: '#e5e7eb',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {brandKit?.logo?.url ? 'Logo set' : 'Logo not set'}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                      {brandKit?.logo?.url || 'Add a logo URL'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
                >
                  Brand Personality
                </label>
                <textarea
                  className='brand-form-input'
                  value={brandKit?.brandPersonality || ''}
                  onChange={(e) =>
                    setBrandKit({
                      ...brandKit,
                      brandPersonality: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    fontSize: '0.9rem',
                    minHeight: '60px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Campaign Settings */}
          <div className='panel'>
            <div className='panel-header'>
              <h3 className='panel-title'>Campaign Settings</h3>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
               >
                 Primary Offer
               </label>
               <input
                  className='brand-form-input'
                  type='text'
                  value={campaign?.primaryOffer || ''}
                  onChange={(e) =>
                    setCampaign({ ...campaign, primaryOffer: e.target.value })
                  }
                  style={{
                    width: '100%',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
               >
                 Target Audience
               </label>
               <textarea
                  className='brand-form-input'
                  value={brandKit?.targetAudience || ''}
                  onChange={(e) =>
                    setBrandKit({ ...brandKit, targetAudience: e.target.value })
                  }
                  style={{
                    width: '100%',
                    fontSize: '0.875rem',
                    minHeight: '60px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
               >
                 Voice Prompt
               </label>
               <textarea
                  className='brand-form-input'
                  value={brandKit?.voicePrompt || ''}
                  onChange={(e) =>
                    setBrandKit({ ...brandKit, voicePrompt: e.target.value })
                  }
                  style={{
                    width: '100%',
                    fontSize: '0.9rem',
                    minHeight: '80px',
                  }}
                  placeholder='Describe the tone/voice the AI should follow'
                />
              </div>

              <div className="form-grid form-grid-2col">
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: 'var(--color-text, #1f2937)',
                    }}
                  >
                    Tone Style
                  </label>
                 <select
                    className='brand-form-input'
                    value={brandKit?.toneStyle || ''}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, toneStyle: e.target.value })
                    }
                    style={{
                      width: '100%',
                    }}
                  >
                    <option value=''>Select tone</option>
                    {['professional', 'playful', 'bold', 'minimal', 'luxury', 'edgy'].map(
                      (tone) => (
                        <option key={tone} value={tone}>
                          {tone}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: 'var(--color-text, #1f2937)',
                    }}
                  >
                    Tone of Voice
                  </label>
                 <input
                    className='brand-form-input'
                    type='text'
                    value={brandKit?.toneOfVoice || ''}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, toneOfVoice: e.target.value })
                    }
                    style={{
                      width: '100%',
                      fontSize: '1rem',
                    }}
                    placeholder='Confident, witty, etc.'
                  />
                </div>
              </div>

              <div className="form-grid form-grid-2col">
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: 'var(--color-text, #1f2937)',
                    }}
                  >
                    Preferred Phrases
                  </label>
                 <textarea
                    className='brand-form-input'
                    value={(brandKit?.preferredPhrases || []).join('\n')}
                    onChange={(e) =>
                      setBrandKit({
                        ...brandKit,
                        preferredPhrases: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{
                      width: '100%',
                      fontSize: '0.9rem',
                      minHeight: '80px',
                    }}
                    placeholder={'One per line\nAlways mention sustainability\nUse “creators” instead of “users”'}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: 'var(--color-text, #1f2937)',
                    }}
                  >
                    Forbidden Phrases
                  </label>
                 <textarea
                    className='brand-form-input'
                    value={(brandKit?.forbiddenPhrases || []).join('\n')}
                    onChange={(e) =>
                      setBrandKit({
                        ...brandKit,
                        forbiddenPhrases: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{
                      width: '100%',
                      fontSize: '0.9rem',
                      minHeight: '80px',
                    }}
                    placeholder={'One per line\nDo not use “cheap”\nAvoid slang'}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
               >
                 Logo URL
               </label>
               <input
                  className='brand-form-input'
                  type='url'
                  value={brandKit?.logo?.url || ''}
                  onChange={(e) =>
                    setBrandKit({
                      ...brandKit,
                      logo: e.target.value
                        ? {
                            ...(brandKit.logo || {}),
                            url: e.target.value,
                            position: brandKit.logo?.position || 'top-left',
                          }
                        : undefined,
                    })
                  }
                  style={{
                    width: '100%',
                    fontSize: '1rem',
                  }}
                  placeholder='https://.../logo.png'
                />
                {brandKit?.logo && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: '500',
                        color: 'var(--color-text, #1f2937)',
                      }}
                    >
                      Logo Position
                    </label>
                    <select
                      className='brand-form-input'
                      value={brandKit.logo.position || 'top-left'}
                      onChange={(e) =>
                        setBrandKit({
                          ...brandKit,
                          logo: { ...brandKit.logo, position: e.target.value },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                      }}
                    >
                      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(
                        (pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--color-text, #1f2937)',
                  }}
                >
                  Masking Model
                </label>
                <select
                  className='brand-form-input'
                  value={brandKit?.maskingModel || ''}
                  onChange={(e) =>
                    setBrandKit({ ...brandKit, maskingModel: e.target.value })
                  }
                  style={{
                    width: '100%',
                  }}
                >
                  <option value=''>Select model</option>
                  {maskingModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <small
                  style={{
                    display: 'block',
                    marginTop: '0.35rem',
                    color: 'var(--color-text-secondary, #6b7280)',
                  }}
                >
                  Controls which background-removal model to use for text masking.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h3 className="panel-title">Assets</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-secondary, #6b7280)', fontSize: '0.875rem' }}>
                Upload raw photos and generate on-brand social posts
              </p>
            </div>
            <button
              onClick={handleGenerateOutputs}
              disabled={isGenerating || assets.length === 0 || !brandKit?.id}
              className="btn btn-primary"
              style={{
                opacity: isGenerating || assets.length === 0 || !brandKit?.id ? 0.5 : 1,
                cursor: isGenerating || assets.length === 0 || !brandKit?.id ? 'not-allowed' : 'pointer',
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Outputs'}
            </button>
          </div>

          {generationError && (
            <div
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c00',
              }}
            >
              {generationError}
            </div>
          )}

          {assets.length === 0 && (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'var(--color-bg-secondary, #f9fafb)',
                borderRadius: '12px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <Camera size={48} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary, #9ca3af)' }} />
              </div>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--color-text, #1f2937)' }}>
                No Assets Yet
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary, #6b7280)' }}>
                Upload photos below to get started
              </p>
            </div>
          )}

          {assets.length > 0 && (
            <div
              style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                background: 'var(--color-bg-secondary, #f0f9ff)',
                border: '1px solid var(--color-border, #bfdbfe)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✓</span>
                <strong>{assets.length} asset{assets.length !== 1 ? 's' : ''} uploaded</strong>
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                Ready to generate outputs. Click "Generate Outputs" above to create on-brand social posts.
              </p>
            </div>
          )}

          <AssetUploader 
            workspaceId={workspaceId!}
            campaignId={campaignId!}
            onUploadComplete={loadCampaignData}
          />
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="panel">
          <ApprovalGrid 
            workspaceId={workspaceId!}
            campaignId={campaignId!}
          />
        </div>
      )}

      {activeTab === 'campaign-brief' && (
        <div className="campaign-brief-panel">
          <div className="campaign-brief-header">
            <div>
              <h3>
                Campaign Brief
              </h3>
              <p>
                Define strategic requirements to guide creative generation
              </p>
            </div>

            <button
              onClick={() => setShowBriefEditor(!showBriefEditor)}
              className='btn btn-primary'
            >
              {showBriefEditor ? 'Cancel' : 'Edit Brief'}
            </button>
          </div>

          {showBriefEditor ? (
            <CampaignBriefEditor
              initialData={campaign?.brief || {}}
              onSave={async (briefData) => {
                try {
                  // Save brief data via API
                  const response = await apiFetch(
                    `/api/campaign-briefs/${campaignId}`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ brief: briefData }),
                    }
                  );

                  if (response.ok) {
                    const result = await response.json();
                    setCampaign(result.campaign);
                    setShowBriefEditor(false);
                  } else {
                    console.error('Failed to save campaign brief');
                  }
                } catch (error) {
                  console.error('Error saving campaign brief:', error);
                }
              }}
              onCancel={() => setShowBriefEditor(false)}
            />
          ) : (
            <div className="campaign-brief-display">
              {campaign?.brief ? (
                <div className="campaign-brief-complete">
                  <div className="icon">
                    <ClipboardList size={48} strokeWidth={1.5} />
                  </div>
                  <h4>
                    Campaign Brief Complete
                  </h4>
                  <p>
                    Strategic brief has been defined and is ready for creative
                    generation
                  </p>
                  <div className="campaign-brief-summary">
                    <div className="campaign-brief-summary-item">
                      <strong>Key Message:</strong>{' '}
                      {campaign.brief.keyMessage || 'Not defined'}
                    </div>
                    {campaign.brief.primaryKPI && (
                      <div className="campaign-brief-summary-item">
                        <strong>Primary KPI:</strong>{' '}
                        {campaign.brief.primaryKPI}
                      </div>
                    )}
                    {campaign.brief.primaryAudience?.demographics && (
                      <div className="campaign-brief-summary-item">
                        <strong>Target Audience:</strong>{' '}
                        {campaign.brief.primaryAudience.demographics}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="campaign-brief-empty">
                  <div className="icon">
                    <FileText size={48} strokeWidth={1.5} />
                  </div>
                  <h4>
                    No Campaign Brief Yet
                  </h4>
                  <p>
                    Create a comprehensive campaign brief to guide the AI
                    creative generation process
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
