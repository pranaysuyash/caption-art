import apiFetch from './httpClient';
import type {
  Organization,
  User,
  InviteUser,
  SubscriptionPlan,
  Invoice,
  PaymentMethod,
  AuditLogEntry,
  Integration,
  ApiKey,
  BrandKit,
  OrganizationSettings,
  UserRole
} from '../../types/account';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Organization Management
export async function getOrganization(): Promise<Organization> {
  const response = await apiFetch(`${API_BASE}/api/account/organization`);
  if (!response.ok) throw new Error('Failed to fetch organization');
  return response.json();
}

export async function updateOrganization(data: Partial<Organization>): Promise<Organization> {
  const response = await apiFetch(`${API_BASE}/api/account/organization`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update organization');
  return response.json();
}

// User Management
export async function getUsers(): Promise<User[]> {
  const response = await apiFetch(`${API_BASE}/api/account/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function inviteUser(data: InviteUser): Promise<User> {
  const response = await apiFetch(`${API_BASE}/api/account/users/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to invite user');
  return response.json();
}

export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const response = await apiFetch(`${API_BASE}/api/account/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) throw new Error('Failed to update user role');
  return response.json();
}

export async function removeUser(userId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/account/users/${userId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove user');
}

export async function suspendUser(userId: string): Promise<User> {
  const response = await apiFetch(`${API_BASE}/api/account/users/${userId}/suspend`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to suspend user');
  return response.json();
}

export async function reactivateUser(userId: string): Promise<User> {
  const response = await apiFetch(`${API_BASE}/api/account/users/${userId}/reactivate`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reactivate user');
  return response.json();
}

// Billing & Subscription
export async function getSubscription(): Promise<SubscriptionPlan> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/subscription`);
  if (!response.ok) throw new Error('Failed to fetch subscription');
  return response.json();
}

export async function updateSubscription(planId: string, billingCycle: 'monthly' | 'annual'): Promise<SubscriptionPlan> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/subscription`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, billingCycle }),
  });
  if (!response.ok) throw new Error('Failed to update subscription');
  return response.json();
}

export async function cancelSubscription(): Promise<SubscriptionPlan> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/subscription/cancel`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to cancel subscription');
  return response.json();
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/invoices`);
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/payment-methods`);
  if (!response.ok) throw new Error('Failed to fetch payment methods');
  return response.json();
}

export async function addPaymentMethod(data: any): Promise<PaymentMethod> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to add payment method');
  return response.json();
}

export async function setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/payment-methods/${methodId}/default`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to set default payment method');
  return response.json();
}

export async function removePaymentMethod(methodId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/account/billing/payment-methods/${methodId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove payment method');
}

// Audit Logs
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const response = await apiFetch(`${API_BASE}/api/account/audit-logs?${params}`);
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}

export async function exportAuditLogs(format: 'csv' | 'json'): Promise<Blob> {
  const response = await apiFetch(`${API_BASE}/api/account/audit-logs/export?format=${format}`);
  if (!response.ok) throw new Error('Failed to export audit logs');
  return response.blob();
}

// Integrations
export async function getIntegrations(): Promise<Integration[]> {
  const response = await apiFetch(`${API_BASE}/api/account/integrations`);
  if (!response.ok) throw new Error('Failed to fetch integrations');
  return response.json();
}

export async function connectIntegration(provider: string, config: any): Promise<Integration> {
  const response = await apiFetch(`${API_BASE}/api/account/integrations/${provider}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to connect integration');
  return response.json();
}

export async function disconnectIntegration(integrationId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/account/integrations/${integrationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to disconnect integration');
}

// API Keys
export async function getApiKeys(): Promise<ApiKey[]> {
  const response = await apiFetch(`${API_BASE}/api/account/api-keys`);
  if (!response.ok) throw new Error('Failed to fetch API keys');
  return response.json();
}

export async function createApiKey(name: string, scopes: string[]): Promise<ApiKey> {
  const response = await apiFetch(`${API_BASE}/api/account/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, scopes }),
  });
  if (!response.ok) throw new Error('Failed to create API key');
  return response.json();
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/account/api-keys/${keyId}/revoke`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to revoke API key');
}

// Brand Kits
export async function getBrandKits(): Promise<BrandKit[]> {
  const response = await apiFetch(`${API_BASE}/api/account/brand-kits`);
  if (!response.ok) throw new Error('Failed to fetch brand kits');
  return response.json();
}

export async function createBrandKit(data: Partial<BrandKit>): Promise<BrandKit> {
  const response = await apiFetch(`${API_BASE}/api/account/brand-kits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create brand kit');
  return response.json();
}

export async function updateBrandKit(kitId: string, data: Partial<BrandKit>): Promise<BrandKit> {
  const response = await apiFetch(`${API_BASE}/api/account/brand-kits/${kitId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update brand kit');
  return response.json();
}

export async function setDefaultBrandKit(kitId: string): Promise<BrandKit> {
  const response = await apiFetch(`${API_BASE}/api/account/brand-kits/${kitId}/default`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to set default brand kit');
  return response.json();
}

export async function deleteBrandKit(kitId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/account/brand-kits/${kitId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete brand kit');
}

// Settings
export async function getSettings(): Promise<OrganizationSettings> {
  const response = await apiFetch(`${API_BASE}/api/account/settings`);
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
}

export async function updateSettings(data: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
  const response = await apiFetch(`${API_BASE}/api/account/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update settings');
  return response.json();
}

export const accountClient = {
  // Organization
  getOrganization,
  updateOrganization,
  
  // Users
  getUsers,
  inviteUser,
  updateUserRole,
  removeUser,
  suspendUser,
  reactivateUser,
  
  // Billing
  getSubscription,
  updateSubscription,
  cancelSubscription,
  getInvoices,
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
  
  // Audit
  getAuditLogs,
  exportAuditLogs,
  
  // Integrations
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  
  // API Keys
  getApiKeys,
  createApiKey,
  revokeApiKey,
  
  // Brand Kits
  getBrandKits,
  createBrandKit,
  updateBrandKit,
  setDefaultBrandKit,
  deleteBrandKit,
  
  // Settings
  getSettings,
  updateSettings,
};
