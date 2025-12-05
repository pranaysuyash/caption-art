import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Clock, MapPin, Save } from 'lucide-react';
import { accountClient } from '../../../lib/api/accountClient';
import type { OrganizationSettings } from '../../../types/account';

export function SecuritySettings() {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await accountClient.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await accountClient.updateSettings(settings);
      alert('Security settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string[], value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    
    setSettings(newSettings);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">
          <Shield size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Security & Compliance
        </h2>
        <p className="settings-section-description">
          Configure security policies, authentication, and compliance settings
        </p>
      </div>

      {/* Authentication */}
      <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} />
          Authentication
        </h3>

        <div className="settings-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.security.ssoEnabled}
              onChange={(e) => updateSetting(['security', 'ssoEnabled'], e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div className="settings-form-label" style={{ marginBottom: '0.25rem' }}>
                Enable Single Sign-On (SSO)
              </div>
              <span className="settings-form-hint">
                Allow users to sign in with SAML 2.0 or OAuth providers
              </span>
            </div>
          </label>
        </div>

        <div className="settings-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.security.mfaRequired}
              onChange={(e) => updateSetting(['security', 'mfaRequired'], e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div className="settings-form-label" style={{ marginBottom: '0.25rem' }}>
                Require Multi-Factor Authentication (MFA)
              </div>
              <span className="settings-form-hint">
                All users must enable 2FA to access the account
              </span>
            </div>
          </label>
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label" htmlFor="session-timeout">
            <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            id="session-timeout"
            className="settings-input"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting(['security', 'sessionTimeout'], parseInt(e.target.value))}
            min="5"
            max="480"
          />
          <span className="settings-form-hint">
            Automatically log users out after inactivity
          </span>
        </div>
      </div>

      {/* Access Control */}
      <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} />
          Access Control
        </h3>

        <div className="settings-form-group">
          <label className="settings-form-label" htmlFor="ip-whitelist">
            IP Whitelist
          </label>
          <textarea
            id="ip-whitelist"
            className="settings-textarea"
            value={settings.security.ipWhitelist?.join('\n') || ''}
            onChange={(e) => updateSetting(['security', 'ipWhitelist'], 
              e.target.value.split('\n').filter(ip => ip.trim())
            )}
            placeholder="Enter IP addresses, one per line&#10;192.168.1.1&#10;10.0.0.0/8"
            rows={5}
          />
          <span className="settings-form-hint">
            Restrict access to these IP addresses only (leave empty to allow all)
          </span>
        </div>
      </div>

      {/* Data & Compliance */}
      <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={20} />
          Data & Compliance
        </h3>

        <div className="settings-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.compliance.auditLogEnabled}
              onChange={(e) => updateSetting(['compliance', 'auditLogEnabled'], e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div className="settings-form-label" style={{ marginBottom: '0.25rem' }}>
                Enable Audit Logging
              </div>
              <span className="settings-form-hint">
                Track all user actions for compliance and security monitoring
              </span>
            </div>
          </label>
        </div>

        <div className="settings-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.compliance.gdprMode}
              onChange={(e) => updateSetting(['compliance', 'gdprMode'], e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div className="settings-form-label" style={{ marginBottom: '0.25rem' }}>
                GDPR Compliance Mode
              </div>
              <span className="settings-form-hint">
                Enable additional privacy controls and data processing restrictions
              </span>
            </div>
          </label>
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label" htmlFor="data-retention">
            Data Retention Period (days)
          </label>
          <select
            id="data-retention"
            className="settings-select"
            value={settings.compliance.dataRetention}
            onChange={(e) => updateSetting(['compliance', 'dataRetention'], parseInt(e.target.value))}
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
            <option value="730">2 years</option>
            <option value="1825">5 years</option>
            <option value="-1">Indefinite</option>
          </select>
          <span className="settings-form-hint">
            Automatically delete old data after this period
          </span>
        </div>
      </div>

      {/* Feature Controls */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Feature Controls</h3>

        <div className="settings-form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.features.aiEnabled}
              onChange={(e) => updateSetting(['features', 'aiEnabled'], e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div className="settings-form-label" style={{ marginBottom: '0.25rem' }}>
                Enable AI-Powered Features
              </div>
              <span className="settings-form-hint">
                Allow AI caption generation and content suggestions
              </span>
            </div>
          </label>
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label" htmlFor="max-file-size">
            Maximum File Size (MB)
          </label>
          <input
            type="number"
            id="max-file-size"
            className="settings-input"
            value={settings.features.maxFileSize}
            onChange={(e) => updateSetting(['features', 'maxFileSize'], parseInt(e.target.value))}
            min="1"
            max="1000"
          />
          <span className="settings-form-hint">
            Maximum size for uploaded files
          </span>
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label">
            Storage Usage
          </label>
          <div style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>
                {(settings.features.storageUsed / 1024 / 1024 / 1024).toFixed(2)} GB
              </span>
              <span style={{ color: '#666' }}>
                of {(settings.features.storageLimit / 1024 / 1024 / 1024).toFixed(0)} GB
              </span>
            </div>
            <div style={{
              height: '8px',
              background: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                width: `${(settings.features.storageUsed / settings.features.storageLimit) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-button-group">
        <button
          className="settings-button settings-button-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          {saving ? 'Saving...' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );
}
