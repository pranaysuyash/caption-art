/**
 * Seed Default Roles for Agency System
 * 
 * Creates system roles: Owner, Admin, Member, Viewer
 * Each with pre-defined permission matrix
 */

import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionMatrix {
  // Workspace management
  createWorkspace: boolean;
  deleteWorkspace: boolean;
  editWorkspace: boolean;
  viewWorkspace: boolean;
  
  // Campaign management
  createCampaign: boolean;
  deleteCampaign: boolean;
  editCampaign: boolean;
  viewCampaign: boolean;
  approveCampaign: boolean;
  
  // User management
  inviteUsers: boolean;
  removeUsers: boolean;
  assignRoles: boolean;
  viewUsers: boolean;
  
  // Billing
  viewBilling: boolean;
  manageBilling: boolean;
  
  // Settings
  viewSettings: boolean;
  manageSettings: boolean;
  manageBranding: boolean;
  manageIntegrations: boolean;
  
  // Audit logs
  viewAuditLogs: boolean;
  exportAuditLogs: boolean;
  
  // Content
  createContent: boolean;
  editContent: boolean;
  deleteContent: boolean;
  approveContent: boolean;
  publishContent: boolean;
  
  // Assets
  uploadAssets: boolean;
  deleteAssets: boolean;
  
  // Brand Kits
  createBrandKit: boolean;
  editBrandKit: boolean;
  deleteBrandKit: boolean;
}

const OWNER_PERMISSIONS: PermissionMatrix = {
  createWorkspace: true,
  deleteWorkspace: true,
  editWorkspace: true,
  viewWorkspace: true,
  createCampaign: true,
  deleteCampaign: true,
  editCampaign: true,
  viewCampaign: true,
  approveCampaign: true,
  inviteUsers: true,
  removeUsers: true,
  assignRoles: true,
  viewUsers: true,
  viewBilling: true,
  manageBilling: true,
  viewSettings: true,
  manageSettings: true,
  manageBranding: true,
  manageIntegrations: true,
  viewAuditLogs: true,
  exportAuditLogs: true,
  createContent: true,
  editContent: true,
  deleteContent: true,
  approveContent: true,
  publishContent: true,
  uploadAssets: true,
  deleteAssets: true,
  createBrandKit: true,
  editBrandKit: true,
  deleteBrandKit: true,
};

const ADMIN_PERMISSIONS: PermissionMatrix = {
  createWorkspace: true,
  deleteWorkspace: false, // Only owner can delete
  editWorkspace: true,
  viewWorkspace: true,
  createCampaign: true,
  deleteCampaign: true,
  editCampaign: true,
  viewCampaign: true,
  approveCampaign: true,
  inviteUsers: true,
  removeUsers: false, // Only owner can remove
  assignRoles: true,
  viewUsers: true,
  viewBilling: true,
  manageBilling: false, // Only owner manages billing
  viewSettings: true,
  manageSettings: true,
  manageBranding: true,
  manageIntegrations: true,
  viewAuditLogs: true,
  exportAuditLogs: true,
  createContent: true,
  editContent: true,
  deleteContent: true,
  approveContent: true,
  publishContent: true,
  uploadAssets: true,
  deleteAssets: true,
  createBrandKit: true,
  editBrandKit: true,
  deleteBrandKit: false,
};

const MEMBER_PERMISSIONS: PermissionMatrix = {
  createWorkspace: false,
  deleteWorkspace: false,
  editWorkspace: false,
  viewWorkspace: true,
  createCampaign: true,
  deleteCampaign: false,
  editCampaign: true,
  viewCampaign: true,
  approveCampaign: false, // Can't approve own work
  inviteUsers: false,
  removeUsers: false,
  assignRoles: false,
  viewUsers: true,
  viewBilling: false,
  manageBilling: false,
  viewSettings: true,
  manageSettings: false,
  manageBranding: false,
  manageIntegrations: false,
  viewAuditLogs: false,
  exportAuditLogs: false,
  createContent: true,
  editContent: true,
  deleteContent: false,
  approveContent: false,
  publishContent: false,
  uploadAssets: true,
  deleteAssets: false,
  createBrandKit: false,
  editBrandKit: false,
  deleteBrandKit: false,
};

const VIEWER_PERMISSIONS: PermissionMatrix = {
  createWorkspace: false,
  deleteWorkspace: false,
  editWorkspace: false,
  viewWorkspace: true,
  createCampaign: false,
  deleteCampaign: false,
  editCampaign: false,
  viewCampaign: true,
  approveCampaign: false,
  inviteUsers: false,
  removeUsers: false,
  assignRoles: false,
  viewUsers: true,
  viewBilling: false,
  manageBilling: false,
  viewSettings: true,
  manageSettings: false,
  manageBranding: false,
  manageIntegrations: false,
  viewAuditLogs: false,
  exportAuditLogs: false,
  createContent: false,
  editContent: false,
  deleteContent: false,
  approveContent: false,
  publishContent: false,
  uploadAssets: false,
  deleteAssets: false,
  createBrandKit: false,
  editBrandKit: false,
  deleteBrandKit: false,
};

async function seedRoles(agencyId: string) {
  console.log(`Seeding default roles for agency ${agencyId}...`);

  const roles = [
    {
      name: 'Owner',
      description: 'Full access to all features and settings. Can manage billing and remove users.',
      permissions: OWNER_PERMISSIONS,
      isSystem: true,
    },
    {
      name: 'Admin',
      description: 'Manage workspaces, campaigns, users, and settings. Cannot manage billing or remove users.',
      permissions: ADMIN_PERMISSIONS,
      isSystem: true,
    },
    {
      name: 'Member',
      description: 'Create and edit campaigns and content. Limited access to settings.',
      permissions: MEMBER_PERMISSIONS,
      isSystem: true,
    },
    {
      name: 'Viewer',
      description: 'Read-only access to workspaces and campaigns. Cannot create or edit.',
      permissions: VIEWER_PERMISSIONS,
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        agencyId_name: {
          agencyId,
          name: role.name,
        },
      },
      update: {
        description: role.description,
        permissions: role.permissions as unknown as Prisma.JsonObject,
      },
      create: {
        agencyId,
        name: role.name,
        description: role.description,
        permissions: role.permissions as unknown as Prisma.JsonObject,
        isSystem: role.isSystem,
      },
    });
    console.log(`Created/updated role: ${role.name}`);
  }
}

async function seedDefaultFeatureFlags(agencyId: string) {
  console.log(`Seeding default feature flags for agency ${agencyId}...`);

  const features = [
    { key: 'ai_captions', enabled: true, config: { model: 'gpt-4' } },
    { key: 'batch_processing', enabled: true, config: {} },
    { key: 'white_label', enabled: false, config: {} },
    { key: 'audit_logs', enabled: true, config: { retention_days: 90 } },
    { key: 'sso', enabled: false, config: {} },
    { key: 'api_access', enabled: true, config: { rate_limit: 1000 } },
    { key: 'advanced_analytics', enabled: false, config: {} },
    { key: 'custom_integrations', enabled: false, config: {} },
  ];

  for (const feature of features) {
    await prisma.featureFlag.upsert({
      where: {
        agencyId_featureKey: {
          agencyId,
          featureKey: feature.key,
        },
      },
      update: {
        isEnabled: feature.enabled,
        config: feature.config,
      },
      create: {
        agencyId,
        featureKey: feature.key,
        isEnabled: feature.enabled,
        config: feature.config,
      },
    });
    console.log(`Created/updated feature flag: ${feature.key}`);
  }
}

export { seedRoles, seedDefaultFeatureFlags };
