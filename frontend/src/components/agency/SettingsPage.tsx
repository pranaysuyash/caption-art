import { useState } from 'react';
import { Settings, Users, CreditCard, Shield, Link2, Key, Palette, Bell } from 'lucide-react';
import { OrganizationSettings } from './settings/OrganizationSettings';
import { UserManagement } from './settings/UserManagement';
import { BillingSubscription } from './settings/BillingSubscription';
import { AuditLogs } from './settings/AuditLogs';
import { IntegrationsSettings } from './settings/IntegrationsSettings';
import { BrandKitSettings } from './settings/BrandKitSettings';
import { SecuritySettings } from './settings/SecuritySettings';
import './SettingsPage.css';

type SettingsTab = 
  | 'organization' 
  | 'users' 
  | 'billing' 
  | 'security' 
  | 'integrations' 
  | 'brand-kits' 
  | 'audit-logs';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');

  const tabs = [
    { id: 'organization' as const, label: 'Organization', icon: Settings },
    { id: 'users' as const, label: 'Team & Roles', icon: Users },
    { id: 'billing' as const, label: 'Billing & Plan', icon: CreditCard },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'integrations' as const, label: 'Integrations', icon: Link2 },
    { id: 'brand-kits' as const, label: 'Brand Kits', icon: Palette },
    { id: 'audit-logs' as const, label: 'Audit Logs', icon: Bell },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p className="settings-subtitle">
          Manage your organization, team, billing, and integrations
        </p>
      </div>

      <div className="settings-container">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="settings-content">
          {activeTab === 'organization' && <OrganizationSettings />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'billing' && <BillingSubscription />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'integrations' && <IntegrationsSettings />}
          {activeTab === 'brand-kits' && <BrandKitSettings />}
          {activeTab === 'audit-logs' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
}
