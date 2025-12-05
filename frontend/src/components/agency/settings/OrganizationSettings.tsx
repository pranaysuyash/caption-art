import { useState, useEffect } from 'react';
import { Building, Globe, Save } from 'lucide-react';
import { accountClient } from '../../../lib/api/accountClient';
import type { Organization } from '../../../types/account';

export function OrganizationSettings() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const data = await accountClient.getOrganization();
      setOrg(data);
      setName(data.name);
      setWebsite(data.website || '');
      setIndustry(data.industry || '');
    } catch (error) {
      console.error('Failed to load organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await accountClient.updateOrganization({
        name,
        website: website || undefined,
        industry: industry || undefined,
      });
      setOrg(updated);
      alert('Organization settings updated successfully');
    } catch (error) {
      console.error('Failed to update organization:', error);
      alert('Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">
          <Building size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Organization Profile
        </h2>
        <p className="settings-section-description">
          Manage your organization's basic information and branding
        </p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label" htmlFor="org-name">
          Organization Name
        </label>
        <input
          type="text"
          id="org-name"
          className="settings-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter organization name"
        />
        <span className="settings-form-hint">
          This name will be displayed across the platform
        </span>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label" htmlFor="org-website">
          <Globe size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
          Website
        </label>
        <input
          type="url"
          id="org-website"
          className="settings-input"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label" htmlFor="org-industry">
          Industry
        </label>
        <select
          id="org-industry"
          className="settings-select"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">Select industry</option>
          <option value="advertising">Advertising & Marketing</option>
          <option value="ecommerce">E-commerce</option>
          <option value="media">Media & Publishing</option>
          <option value="technology">Technology</option>
          <option value="retail">Retail</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
          <option value="education">Education</option>
          <option value="nonprofit">Non-profit</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Organization ID</label>
        <input
          type="text"
          className="settings-input"
          value={org?.id || ''}
          disabled
          style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
        />
        <span className="settings-form-hint">
          Use this ID for API integrations and support requests
        </span>
      </div>

      <div className="settings-button-group">
        <button
          className="settings-button settings-button-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
