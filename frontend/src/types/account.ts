// Account-level types for enterprise features

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type PermissionScope = 
  | 'workspace.create' 
  | 'workspace.edit' 
  | 'workspace.delete'
  | 'campaign.create' 
  | 'campaign.edit' 
  | 'campaign.delete' 
  | 'campaign.approve'
  | 'brandkit.create' 
  | 'brandkit.edit' 
  | 'brandkit.delete'
  | 'user.invite' 
  | 'user.manage' 
  | 'user.remove'
  | 'billing.view' 
  | 'billing.manage'
  | 'settings.view' 
  | 'settings.manage'
  | 'integrations.manage'
  | 'audit.view';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  industry?: string;
  createdAt: string;
  owner: User;
  plan: SubscriptionPlan;
  settings: OrganizationSettings;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  price: number;
  currency: string;
  seats: number;
  usedSeats: number;
  features: PlanFeature[];
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface PlanFeature {
  key: string;
  name: string;
  enabled: boolean;
  limit?: number;
  used?: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  downloadUrl: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: User;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface Integration {
  id: string;
  name: string;
  provider: string;
  type: 'social' | 'storage' | 'analytics' | 'crm' | 'sso' | 'api';
  logo: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt?: string;
  config: Record<string, any>;
  scopes: string[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  scopes: string[];
  status: 'active' | 'revoked';
}

export interface BrandKit {
  id: string;
  name: string;
  isDefault: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    [key: string]: string;
  };
  fonts: {
    heading: string;
    body: string;
    [key: string]: string;
  };
  logos: {
    primary?: string;
    secondary?: string;
    icon?: string;
    [key: string]: string | undefined;
  };
  guidelines?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  branding: {
    whiteLabelEnabled: boolean;
    customDomain?: string;
    favicon?: string;
  };
  security: {
    ssoEnabled: boolean;
    mfaRequired: boolean;
    sessionTimeout: number;
    ipWhitelist?: string[];
  };
  features: {
    aiEnabled: boolean;
    exportFormats: string[];
    maxFileSize: number;
    storageLimit: number;
    storageUsed: number;
  };
  notifications: {
    emailNotifications: boolean;
    weeklyReports: boolean;
    securityAlerts: boolean;
  };
  compliance: {
    dataRetention: number;
    auditLogEnabled: boolean;
    gdprMode: boolean;
  };
}

export interface InviteUser {
  email: string;
  role: UserRole;
  workspaces?: string[];
  message?: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: PermissionScope[];
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, PermissionScope[]> = {
  owner: [
    'workspace.create', 'workspace.edit', 'workspace.delete',
    'campaign.create', 'campaign.edit', 'campaign.delete', 'campaign.approve',
    'brandkit.create', 'brandkit.edit', 'brandkit.delete',
    'user.invite', 'user.manage', 'user.remove',
    'billing.view', 'billing.manage',
    'settings.view', 'settings.manage',
    'integrations.manage',
    'audit.view'
  ],
  admin: [
    'workspace.create', 'workspace.edit',
    'campaign.create', 'campaign.edit', 'campaign.delete', 'campaign.approve',
    'brandkit.create', 'brandkit.edit', 'brandkit.delete',
    'user.invite', 'user.manage',
    'settings.view',
    'integrations.manage',
    'audit.view'
  ],
  member: [
    'campaign.create', 'campaign.edit',
    'brandkit.create', 'brandkit.edit',
    'settings.view'
  ],
  viewer: [
    'settings.view'
  ]
};
