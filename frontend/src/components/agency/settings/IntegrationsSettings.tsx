import { useState, useEffect } from 'react';
import { Link2, Plus, Check, X, Settings } from 'lucide-react';
import { accountClient } from '../../../lib/api/accountClient';
import type { Integration, ApiKey } from '../../../types/account';

export function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [intData, keysData] = await Promise.all([
        accountClient.getIntegrations(),
        accountClient.getApiKeys(),
      ]);
      setIntegrations(intData);
      setApiKeys(keysData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      await accountClient.connectIntegration(provider, {});
      alert(`Connected to ${provider}`);
      loadData();
    } catch (error) {
      console.error('Failed to connect:', error);
      alert(`Failed to connect to ${provider}`);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    try {
      await accountClient.disconnectIntegration(integrationId);
      alert('Integration disconnected');
      loadData();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect integration');
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName) return;

    try {
      const newKey = await accountClient.createApiKey(newKeyName, ['read', 'write']);
      alert(`API Key created! Key: ${newKey.key}\n\nSave this key now - it won't be shown again.`);
      setShowCreateKey(false);
      setNewKeyName('');
      loadData();
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

    try {
      await accountClient.revokeApiKey(keyId);
      alert('API key revoked');
      loadData();
    } catch (error) {
      console.error('Failed to revoke key:', error);
      alert('Failed to revoke API key');
    }
  };

  const getIntegrationIcon = (type: string) => {
    const icons: Record<string, string> = {
      social: '📱',
      storage: '💾',
      analytics: '📊',
      crm: '👥',
      sso: '🔐',
      api: '🔧',
    };
    return icons[type] || '🔗';
  };

  const availableIntegrations = [
    { provider: 'facebook', name: 'Facebook', type: 'social', description: 'Post to Facebook pages and groups' },
    { provider: 'instagram', name: 'Instagram', type: 'social', description: 'Share content to Instagram' },
    { provider: 'twitter', name: 'Twitter/X', type: 'social', description: 'Tweet and manage X posts' },
    { provider: 'linkedin', name: 'LinkedIn', type: 'social', description: 'Publish to LinkedIn' },
    { provider: 'google-drive', name: 'Google Drive', type: 'storage', description: 'Store and sync files' },
    { provider: 'dropbox', name: 'Dropbox', type: 'storage', description: 'Cloud file storage' },
    { provider: 'slack', name: 'Slack', type: 'crm', description: 'Team notifications' },
    { provider: 'google-analytics', name: 'Google Analytics', type: 'analytics', description: 'Track campaign performance' },
    { provider: 'okta', name: 'Okta', type: 'sso', description: 'Single Sign-On' },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">
          <Link2 size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Integrations & API
        </h2>
        <p className="settings-section-description">
          Connect external services and manage API access
        </p>
      </div>

      {/* Connected Integrations */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Connected Services</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {availableIntegrations.map((integration) => {
            const connected = integrations.find(i => i.provider === integration.provider);
            
            return (
              <div
                key={integration.provider}
                style={{
                  padding: '1.5rem',
                  border: connected ? '2px solid #10b981' : '1px solid #e0e0e0',
                  borderRadius: '12px',
                  background: connected ? '#f0fdf4' : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>{getIntegrationIcon(integration.type)}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                      {integration.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                      {integration.description}
                    </p>
                  </div>
                </div>

                {connected ? (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      background: '#d1fae5',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#065f46',
                    }}>
                      <Check size={16} />
                      Connected {connected.connectedAt && `on ${new Date(connected.connectedAt).toLocaleDateString()}`}
                    </div>
                    <button
                      onClick={() => handleDisconnect(connected.id)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ef4444',
                        background: 'white',
                        color: '#ef4444',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(integration.provider)}
                    className="settings-button settings-button-primary"
                    style={{ width: '100%' }}
                  >
                    <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* API Keys */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>API Keys</h3>
          <button
            className="settings-button settings-button-primary"
            onClick={() => setShowCreateKey(true)}
          >
            <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Create API Key
          </button>
        </div>

        {showCreateKey && (
          <div style={{
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Create New API Key</h4>
            <div className="settings-form-group">
              <label className="settings-form-label">Key Name</label>
              <input
                type="text"
                className="settings-input"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production API Key"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="settings-button settings-button-primary"
                onClick={handleCreateApiKey}
              >
                Create Key
              </button>
              <button
                className="settings-button settings-button-secondary"
                onClick={() => {
                  setShowCreateKey(false);
                  setNewKeyName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {apiKeys.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  background: key.status === 'revoked' ? '#fee2e2' : 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                      {key.name}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                      {key.key.substring(0, 20)}••••••••
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                    </div>
                  </div>
                  {key.status === 'active' ? (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #ef4444',
                        background: 'white',
                        color: '#ef4444',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      <X size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      Revoke
                    </button>
                  ) : (
                    <span style={{
                      padding: '0.5rem 1rem',
                      background: '#fecaca',
                      color: '#991b1b',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}>
                      Revoked
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}>
                  {key.scopes.map((scope) => (
                    <span
                      key={scope}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#e0e0e0',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#666',
                      }}
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No API keys created yet. Create your first API key to start using our API.
          </p>
        )}

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
        }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>API Documentation</strong>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>
            Visit our <a href="/docs/api" style={{ color: '#2563eb', textDecoration: 'underline' }}>API documentation</a> to learn how to integrate with Caption Art.
          </p>
        </div>
      </div>
    </div>
  );
}
