import { getPrismaClient } from '../lib/prisma';
import { log } from '../middleware/logger';
import { v4 as uuidv4 } from 'uuid';

// Types (mirroring frontend types where possible, but derived from Prisma)
// Ideally we would share types, but for now we'll define return shapes matching the client expectations

export class AccountService {
  private static prisma = getPrismaClient();

  // Organization Management
  static async getOrganization(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        subscription: true,
      }
    });
    
    if (!agency) throw new Error('Agency not found');

    return {
      id: agency.id,
      name: agency.name,
      licenseKey: agency.licenseKey,
      billingActive: agency.billingActive,
      planType: agency.planType,
      timezone: agency.timezone,
      language: agency.language,
      contactEmail: agency.contactEmail,
      contactPhone: agency.contactPhone,
      // Add other fields as per frontend expectation if needed
    };
  }

  static async updateOrganization(agencyId: string, data: any) {
    const agency = await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        name: data.name,
        timezone: data.timezone,
        language: data.language,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        // Add other updatable fields
      }
    });
    return agency;
  }

  // User Management
  static async getUsers(agencyId: string) {
    const users = await this.prisma.user.findMany({
      where: { agencyId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      role: user.userRoles[0]?.role?.name.toLowerCase() || 'member', // Simplified role mapping
      roles: user.userRoles.map(ur => ({
        role: ur.role.name,
        workspaceId: ur.workspaceId
      })),
      createdAt: user.createdAt
    }));
  }

  static async inviteUser(agencyId: string, email: string, roleName: string) {
    // 1. Check if user exists
    let user = await this.prisma.user.findUnique({ where: { email } });
    
    if (user) {
        if (user.agencyId === agencyId) {
             throw new Error('User already in this agency');
        } else {
             throw new Error('User belongs to another agency');
        }
    }

    // 2. Create user (invited status)
    user = await this.prisma.user.create({
      data: {
        email,
        agencyId,
        status: 'invited',
        name: email.split('@')[0], // Default name
      }
    });

    // 3. Assign role
    const role = await this.prisma.role.findFirst({
        where: { agencyId, name: { equals: roleName, mode: 'insensitive' } }
    }) || await this.prisma.role.findFirst({
        where: { agencyId, name: 'Member' } // Fallback
    }) || await this.prisma.role.findFirst({
         where: { isSystem: true, name: 'Member' } // System fallback if we had system roles independent of agency, but schema links role to agency
    });
    
    // If no role found (e.g. seeding issue), create a default Member role?
    // Assuming roles exist. If not, we might need to handle that.
    
    if (role) {
        await this.prisma.userRole.create({
            data: {
                userId: user.id,
                roleId: role.id
            }
        });
    }

    // TODO: Send invitation email

    return user;
  }

  static async updateUserRole(userId: string, roleName: string) {
    const user = await this.prisma.user.findUnique({ 
        where: { id: userId },
        include: { userRoles: true }
    });
    if (!user) throw new Error('User not found');

    // Find the new role
    const role = await this.prisma.role.findFirst({
        where: { agencyId: user.agencyId, name: { equals: roleName, mode: 'insensitive' } }
    });

    if (!role) throw new Error(`Role ${roleName} not found`);

    // Update user role (assuming single role per user for agency level for now)
    // Remove existing agency-level roles
    await this.prisma.userRole.deleteMany({
        where: { 
            userId,
            workspaceId: null 
        }
    });

    // Add new role
    await this.prisma.userRole.create({
        data: {
            userId,
            roleId: role.id
        }
    });

    return this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } }
    });
  }

  static async removeUser(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  static async suspendUser(userId: string) {
    return this.prisma.user.update({
        where: { id: userId },
        data: { status: 'suspended' }
    });
  }

  static async reactivateUser(userId: string) {
    return this.prisma.user.update({
        where: { id: userId },
        data: { status: 'active' }
    });
  }

  // Billing & Subscription
  static async getSubscription(agencyId: string) {
    const sub = await this.prisma.subscription.findUnique({
        where: { agencyId }
    });
    
    if (!sub) {
        // Return a default "free" subscription structure if none exists
        return {
            planId: 'free',
            status: 'active',
            seats: 1,
            seatsUsed: 1,
            billingCycle: 'monthly',
            amount: 0,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000),
            cancelAtPeriodEnd: false
        };
    }
    return sub;
  }

  static async updateSubscription(agencyId: string, planId: string, billingCycle: string) {
    // Logic to update subscription (integrate with Stripe here in real app)
    const sub = await this.prisma.subscription.upsert({
        where: { agencyId },
        create: {
            agencyId,
            planId,
            planName: planId.charAt(0).toUpperCase() + planId.slice(1),
            billingCycle,
            status: 'active',
            seats: 5, // Default for paid?
            amount: planId === 'professional' ? 149 : 49,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000),
        },
        update: {
            planId,
            planName: planId.charAt(0).toUpperCase() + planId.slice(1),
            billingCycle,
            // Logic for pro-rating, etc. omitted for v1
        }
    });
    
    // Also update Agency planType
    await this.prisma.agency.update({
        where: { id: agencyId },
        data: { planType: planId === 'free' ? 'free' : 'paid' }
    });

    return sub;
  }

  static async cancelSubscription(agencyId: string) {
     return this.prisma.subscription.update({
         where: { agencyId },
         data: { cancelAtPeriodEnd: true }
     });
  }

  static async getInvoices(agencyId: string) {
      const sub = await this.prisma.subscription.findUnique({ where: { agencyId } });
      if (!sub) return [];
      return this.prisma.invoice.findMany({
          where: { subscriptionId: sub.id },
          orderBy: { date: 'desc' }
      });
  }

  static async getPaymentMethods(agencyId: string) {
      // Mock implementation as PaymentMethod model is not in schema provided earlier?
      // Wait, let me check schema again.
      // Schema had `PaymentMethod`? No, it had `invoices` and `subscription` and `Integration`.
      // The schema I read in step 24 DOES NOT have `PaymentMethod` model! 
      // It has `Agency`, `User`, `Subscription`, `Invoice`.
      // Ah, `ACCOUNT_SETTINGS_COMPLETE.md` listed it, but schema didn't have it.
      // I will return empty array for now or minimal mock.
      return [];
  }

  // Audit Logs
  static async getAuditLogs(agencyId: string, filters: any) {
    const where: any = { agencyId };
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const limit = filters.limit ? parseInt(filters.limit) : 50;

    const logs = await this.prisma.auditLog.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, avatar: true } } }
    });

    return logs;
  }

  static async createAuditLog(agencyId: string, userId: string, action: string, entityType: string, entityId: string, details?: any) {
      return this.prisma.auditLog.create({
          data: {
              agencyId,
              userId,
              action,
              entityType,
              entityId,
              details
          }
      });
  }

  // Integrations
  static async getIntegrations(agencyId: string) {
      return this.prisma.integration.findMany({
          where: { agencyId }
      });
  }

  static async connectIntegration(agencyId: string, provider: string, config: any) {
       return this.prisma.integration.create({
           data: {
               agencyId,
               provider,
               type: 'oauth', // simplify
               name: provider, // Display name
               config
           }
       });
  }

  static async disconnectIntegration(integrationId: string) {
      return this.prisma.integration.delete({ where: { id: integrationId } });
  }

  // API Keys (Integration type='api_key'?)
  // Schema has `Integration` but maybe we use that for API keys too?
  // Schema in `ACCOUNT_SETTINGS_COMPLETE.md` had `api_keys` table.
  // Schema in `AGENCY_SETTINGS_IMPLEMENTATION.md` had `Integration` type `api_key`.
  // Schema in `schema.prisma` has `Integration` with `type`.
  // So we manage API keys as Integrations with type='api_key'.

  static async getApiKeys(agencyId: string) {
      return this.prisma.integration.findMany({
          where: { agencyId, type: 'api_key' }
      });
  }

  static async createApiKey(agencyId: string, name: string, scopes: string[]) {
      const key = uuidv4();
      // Store just the key or hash? Ideally hash.
      // For mvp, storing in config.
      return this.prisma.integration.create({
          data: {
              agencyId,
              type: 'api_key',
              provider: 'internal',
              name,
              config: { key, scopes }, // CAUTION: Storing key in plain text in config for MVP
              isActive: true
          }
      });
  }

  static async revokeApiKey(id: string) {
      return this.prisma.integration.update({
          where: { id },
          data: { isActive: false }
      });
  }

  // Brand Kits
  static async getBrandKits(agencyId: string) {
      return this.prisma.brandKit.findMany({
          where: { agencyId }
      });
  }

  // Settings
  // Schema has `Agency` with `settings JSONB`. assuming that's it?
  // No, schema says `FeatureFlag` for settings?
  // `Agency` model has: name, timezone, language, contactEmail...
  // `FeatureFlag` has agencyId, featureKey, isEnabled, config.
  // We can treat `settings` as a combo of generic agency fields and FeatureFlags.

  static async getSettings(agencyId: string) {
      const agency = await this.prisma.agency.findUnique({
          where: { id: agencyId },
          include: { featureFlags: true }
      });
      
      if (!agency) throw new Error('Agency not found');

      return {
          branding: {
              name: agency.name,
              // ...
          },
          features: agency.featureFlags.reduce((acc: any, flag) => {
              acc[flag.featureKey] = flag.isEnabled;
              return acc;
          }, {})
      };
  }

  static async updateSettings(agencyId: string, data: any) {
      // Data contains { branding, features, ... }
      // Update basic details
      if (data.branding) {
          // Update agency name etc if provided
      }
      
      // Update feature flags
      if (data.features) {
          for (const [key, value] of Object.entries(data.features)) {
             await this.prisma.featureFlag.upsert({
                 where: {
                     agencyId_featureKey: { agencyId, featureKey: key }
                 },
                 create: {
                     agencyId,
                     featureKey: key,
                     isEnabled: value as boolean
                 },
                 update: {
                     isEnabled: value as boolean
                 }
             });
          }
      }

      return this.getSettings(agencyId);
  }
}
