import { useState, useEffect } from 'react';
import { Palette, Plus, Star, Trash2, Save } from 'lucide-react';
import { accountClient } from '../../../lib/api/accountClient';
import type { BrandKit } from '../../../types/account';

export function BrandKitSettings() {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Partial<BrandKit>>({
    name: '',
    colors: { primary: '#007bff', secondary: '#6c757d', accent: '#28a745' },
    fonts: { heading: 'Inter', body: 'Inter' },
    logos: {},
    guidelines: '',
  });

  useEffect(() => {
    loadBrandKits();
  }, []);

  const loadBrandKits = async () => {
    try {
      const data = await accountClient.getBrandKits();
      setBrandKits(data);
    } catch (error) {
      console.error('Failed to load brand kits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await accountClient.createBrandKit(formData);
      alert('Brand kit created successfully');
      setShowCreate(false);
      resetForm();
      loadBrandKits();
    } catch (error) {
      console.error('Failed to create brand kit:', error);
      alert('Failed to create brand kit');
    }
  };

  const handleUpdate = async (kitId: string) => {
    try {
      await accountClient.updateBrandKit(kitId, formData);
      alert('Brand kit updated successfully');
      setEditing(null);
      resetForm();
      loadBrandKits();
    } catch (error) {
      console.error('Failed to update brand kit:', error);
      alert('Failed to update brand kit');
    }
  };

  const handleDelete = async (kitId: string) => {
    if (!confirm('Are you sure you want to delete this brand kit?')) return;

    try {
      await accountClient.deleteBrandKit(kitId);
      alert('Brand kit deleted successfully');
      loadBrandKits();
    } catch (error) {
      console.error('Failed to delete brand kit:', error);
      alert('Failed to delete brand kit');
    }
  };

  const handleSetDefault = async (kitId: string) => {
    try {
      await accountClient.setDefaultBrandKit(kitId);
      alert('Default brand kit updated');
      loadBrandKits();
    } catch (error) {
      console.error('Failed to set default:', error);
      alert('Failed to set default brand kit');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      colors: { primary: '#007bff', secondary: '#6c757d', accent: '#28a745' },
      fonts: { heading: 'Inter', body: 'Inter' },
      logos: {},
      guidelines: '',
    });
  };

  const startEdit = (kit: BrandKit) => {
    setFormData(kit);
    setEditing(kit.id);
    setShowCreate(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='settings-section'>
      <div className='settings-section-header'>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2 className='settings-section-title'>
              <Palette
                size={24}
                style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
              />
              Brand Kits
            </h2>
            <p className='settings-section-description'>
              Manage your brand colors, fonts, logos, and guidelines
            </p>
          </div>
          <button
            className='settings-button settings-button-primary'
            onClick={() => {
              setShowCreate(true);
              setEditing(null);
              resetForm();
            }}
          >
            <Plus
              size={16}
              style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
            />
            Create Brand Kit
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreate || editing) && (
        <div
          style={{
            padding: '2rem',
            background: '#f8f9fa',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '2px solid #e0e0e0',
          }}
        >
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>
            {editing ? 'Edit Brand Kit' : 'Create New Brand Kit'}
          </h3>

          <div className='settings-form-group'>
            <label className='settings-form-label'>Brand Kit Name</label>
            <input
              type='text'
              className='settings-input'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='e.g. Primary Brand, Holiday Campaign'
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className='settings-form-label'>Brand Colors</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
              }}
            >
              {['primary', 'secondary', 'accent'].map((colorKey) => (
                <div key={colorKey}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      marginBottom: '0.5rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {colorKey}
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type='color'
                      value={formData.colors?.[colorKey] || '#000000'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          colors: {
                            primary: formData.colors?.primary || '#007bff',
                            secondary: formData.colors?.secondary || '#6c757d',
                            accent: formData.colors?.accent || '#28a745',
                            ...formData.colors,
                            [colorKey]: e.target.value,
                          },
                        })
                      }
                      style={{
                        width: '50px',
                        height: '40px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type='text'
                      value={formData.colors?.[colorKey] || '#000000'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          colors: {
                            primary: formData.colors?.primary || '#007bff',
                            secondary: formData.colors?.secondary || '#6c757d',
                            accent: formData.colors?.accent || '#28a745',
                            ...formData.colors,
                            [colorKey]: e.target.value,
                          },
                        })
                      }
                      className='settings-input'
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className='settings-form-label'>Typography</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Heading Font
                </label>
                <select
                  className='settings-select'
                  value={formData.fonts?.heading || 'Inter'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fonts: {
                        heading: e.target.value,
                        body: formData.fonts?.body || 'Inter',
                        ...formData.fonts,
                      },
                    })
                  }
                >
                  <option value='Inter'>Inter</option>
                  <option value='Roboto'>Roboto</option>
                  <option value='Open Sans'>Open Sans</option>
                  <option value='Montserrat'>Montserrat</option>
                  <option value='Playfair Display'>Playfair Display</option>
                  <option value='Merriweather'>Merriweather</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Body Font
                </label>
                <select
                  className='settings-select'
                  value={formData.fonts?.body || 'Inter'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fonts: {
                        heading: formData.fonts?.heading || 'Inter',
                        body: e.target.value,
                        ...formData.fonts,
                      },
                    })
                  }
                >
                  <option value='Inter'>Inter</option>
                  <option value='Roboto'>Roboto</option>
                  <option value='Open Sans'>Open Sans</option>
                  <option value='Lato'>Lato</option>
                  <option value='Source Sans Pro'>Source Sans Pro</option>
                </select>
              </div>
            </div>
          </div>

          <div className='settings-form-group'>
            <label className='settings-form-label'>Brand Guidelines</label>
            <textarea
              className='settings-textarea'
              value={formData.guidelines}
              onChange={(e) =>
                setFormData({ ...formData, guidelines: e.target.value })
              }
              placeholder="Enter brand guidelines, tone of voice, dos and don'ts..."
              rows={6}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className='settings-button settings-button-primary'
              onClick={() => (editing ? handleUpdate(editing) : handleCreate())}
            >
              <Save
                size={16}
                style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
              />
              {editing ? 'Update' : 'Create'} Brand Kit
            </button>
            <button
              className='settings-button settings-button-secondary'
              onClick={() => {
                setShowCreate(false);
                setEditing(null);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Brand Kits List */}
      {brandKits.length > 0 ? (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {brandKits.map((kit) => (
            <div
              key={kit.id}
              style={{
                padding: '2rem',
                border: kit.isDefault
                  ? '2px solid #8b5cf6'
                  : '1px solid #e0e0e0',
                borderRadius: '12px',
                background: kit.isDefault ? '#faf5ff' : 'white',
                position: 'relative',
              }}
            >
              {kit.isDefault && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#8b5cf6',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <Star size={16} />
                  Default
                </div>
              )}

              <h3
                style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {kit.name}
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                  }}
                >
                  Colors
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {Object.entries(kit.colors).map(([key, value]) => (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          background: value,
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          marginBottom: '0.5rem',
                        }}
                      />
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          textTransform: 'capitalize',
                        }}
                      >
                        {key}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: '#666',
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                  }}
                >
                  Fonts
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      Heading
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        fontFamily: kit.fonts.heading,
                      }}
                    >
                      {kit.fonts.heading}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      Body
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        fontFamily: kit.fonts.body,
                      }}
                    >
                      {kit.fonts.body}
                    </div>
                  </div>
                </div>
              </div>

              {kit.guidelines && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      marginBottom: '0.75rem',
                    }}
                  >
                    Guidelines
                  </div>
                  <div
                    style={{
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      color: '#666',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {kit.guidelines}
                  </div>
                </div>
              )}

              <div
                style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}
              >
                {!kit.isDefault && (
                  <button
                    className='settings-button settings-button-secondary'
                    onClick={() => handleSetDefault(kit.id)}
                  >
                    <Star
                      size={16}
                      style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
                    />
                    Set as Default
                  </button>
                )}
                <button
                  className='settings-button settings-button-secondary'
                  onClick={() => startEdit(kit)}
                >
                  Edit
                </button>
                {!kit.isDefault && (
                  <button
                    className='settings-button settings-button-danger'
                    onClick={() => handleDelete(kit.id)}
                  >
                    <Trash2
                      size={16}
                      style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
                    />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: '#f8f9fa',
            borderRadius: '12px',
          }}
        >
          <Palette size={48} color='#ccc' style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
            No Brand Kits Yet
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#999' }}>
            Create your first brand kit to maintain consistent branding across
            campaigns
          </p>
          <button
            className='settings-button settings-button-primary'
            onClick={() => {
              setShowCreate(true);
              resetForm();
            }}
          >
            <Plus
              size={16}
              style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
            />
            Create Your First Brand Kit
          </button>
        </div>
      )}
    </div>
  );
}
