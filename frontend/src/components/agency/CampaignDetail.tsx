import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CampaignBriefEditor } from '../CampaignBriefEditor';
import '../CampaignBriefEditor.css';
import apiFetch from '../../lib/api/httpClient';

export function CampaignDetail() {
  const { workspaceId, campaignId } = useParams<{
    workspaceId: string;
    campaignId: string;
  }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'brand-kit' | 'assets' | 'campaign-brief'
  >('brand-kit');
  const [showBriefEditor, setShowBriefEditor] = useState(false);
  const [maskingModels, setMaskingModels] = useState<string[]>([]);

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
      // Update Campaign
      await apiFetch(
        `${
          import.meta.env.VITE_API_BASE || 'http://localhost:3001'
        }/api/campaigns/${campaignId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaign),
        }
      );

      // Update Brand Kit
      if (brandKit.id) {
        await apiFetch(
          `${
            import.meta.env.VITE_API_BASE || 'http://localhost:3001'
          }/api/brand-kits/${brandKit.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              colors: brandKit.colors,
              fonts: brandKit.fonts,
              logo: brandKit.logo,
              voicePrompt: brandKit.voicePrompt,
              brandPersonality: brandKit.brandPersonality,
              targetAudience: brandKit.targetAudience,
              valueProposition: brandKit.valueProposition,
              toneStyle: brandKit.toneStyle,
              toneOfVoice: brandKit.toneOfVoice,
              preferredPhrases: brandKit.preferredPhrases,
              forbiddenPhrases: brandKit.forbiddenPhrases,
              keywords: brandKit.keywords,
              values: brandKit.values,
              keyDifferentiators: brandKit.keyDifferentiators,
              imageryStyle: brandKit.imageryStyle,
              maskingModel: brandKit.maskingModel,
            }),
          }
        );
      }

      alert('Campaign data saved!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data');
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
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div
      style={{ padding: '2rem', fontFamily: 'var(--font-body, sans-serif)' }}
    >
      <style>
        {`.brand-form-input {
            background: #161616;
            border: 1px solid #333;
            color: #f5f5f5;
            padding: 0.75rem;
            border-radius: 6px;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .brand-form-input::placeholder {
            color: #9ca3af;
          }
          .brand-form-input:focus {
            outline: none;
            border-color: #7c8cff;
            box-shadow: 0 0 0 2px rgba(124, 140, 255, 0.2);
          }`}
      </style>
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
                    {Math.round(value)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Content */}
      {activeTab === 'brand-kit' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
          }}
        >
          {/* Brand Kit Editor */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary, white)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--color-text, #1f2937)',
                  margin: 0,
                }}
              >
                Brand Configuration
              </h3>
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
                      onChange={(e) =>
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            primary: e.target.value,
                          },
                        })
                      }
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
                      onChange={(e) =>
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            secondary: e.target.value,
                          },
                        })
                      }
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
                      onChange={(e) =>
                        setBrandKit({
                          ...brandKit,
                          colors: {
                            ...brandKit.colors,
                            tertiary: e.target.value,
                          },
                        })
                      }
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
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary, white)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1rem 0',
              }}
            >
              Campaign Settings
            </h3>

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

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
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

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
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
        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary, white)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--color-text, #1f2937)',
                margin: 0,
              }}
            >
              Campaign Assets
            </h3>

            <button className='btn btn-primary'>+ Upload Assets</button>
          </div>

          {assets.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                border: '2px dashed var(--color-border, #d1d5db)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background, #f8fafc)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
              <h4
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1rem',
                  color: 'var(--color-text, #1f2937)',
                  margin: '0 0 0.5rem 0',
                }}
              >
                No assets yet
              </h4>
              <p
                style={{
                  color: 'var(--color-text-secondary, #6b7280)',
                  margin: 0,
                  fontSize: '0.875rem',
                }}
              >
                Upload images and videos to start generating creatives
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    backgroundColor: 'var(--color-background, #f8fafc)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'var(--color-primary, #2563eb)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      fontSize: '1.5rem',
                      color: 'white',
                    }}
                  >
                    🖼️
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--color-text, #1f2937)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {asset.filename}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary, #6b7280)',
                    }}
                  >
                    {asset.size} • {asset.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaign-brief' && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary, white)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--color-text, #1f2937)',
                  margin: '0 0 0.5rem 0',
                }}
              >
                Campaign Brief
              </h3>
              <p
                style={{
                  color: 'var(--color-text-secondary, #6b7280)',
                  margin: 0,
                  fontSize: '0.875rem',
                }}
              >
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
            <div
              style={{
                minHeight: '200px',
                padding: '2rem',
                border: '2px dashed var(--color-border, #d1d5db)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background, #f8fafc)',
                textAlign: 'center',
              }}
            >
              {campaign?.brief ? (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                    📋
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-heading, sans-serif)',
                      fontSize: '1rem',
                      color: 'var(--color-text, #1f2937)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    Campaign Brief Complete
                  </h4>
                  <p
                    style={{
                      color: 'var(--color-text-secondary, #6b7280)',
                      margin: 0,
                      fontSize: '0.875rem',
                    }}
                  >
                    Strategic brief has been defined and is ready for creative
                    generation
                  </p>
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: 'var(--color-surface, white)',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border, #e5e7eb)',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      <strong>Key Message:</strong>{' '}
                      {campaign.brief.keyMessage || 'Not defined'}
                    </div>
                    {campaign.brief.primaryKPI && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary, #6b7280)',
                          marginTop: '0.5rem',
                        }}
                      >
                        <strong>Primary KPI:</strong>{' '}
                        {campaign.brief.primaryKPI}
                      </div>
                    )}
                    {campaign.brief.primaryAudience?.demographics && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary, #6b7280)',
                          marginTop: '0.5rem',
                        }}
                      >
                        <strong>Target Audience:</strong>{' '}
                        {campaign.brief.primaryAudience.demographics}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    📝
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-heading, sans-serif)',
                      fontSize: '1rem',
                      color: 'var(--color-text, #1f2937)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    No Campaign Brief Yet
                  </h4>
                  <p
                    style={{
                      color: 'var(--color-text-secondary, #6b7280)',
                      margin: 0,
                      fontSize: '0.875rem',
                    }}
                  >
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
