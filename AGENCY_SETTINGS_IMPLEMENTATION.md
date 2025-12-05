# Agency Settings Implementation Plan

## Overview
Implementing enterprise-grade agency settings based on industry best practices from Notion, Buffer, Canva, Frame.io, and Hootsuite.

## Requirements Analysis

### 1. Account-Level Settings (Table Stakes)
- ✅ Company/organization profile
- ✅ Plan overview and management
- ✅ Workspace switcher
- ✅ Settings accessible via profile menu

### 2. User Roles & Permissions (Table Stakes)
- ⚠️ **NEEDS IMPLEMENTATION**
  - Role hierarchy: Owner → Admin → Member
  - User invitation system
  - Permission matrix
  - Role assignment UI

### 3. Billing & Subscription (Table Stakes)
- ⚠️ **NEEDS ENHANCEMENT**
  - Current plan display (basic exists)
  - Seat management
  - Invoice history
  - Payment methods
  - Upgrade/downgrade flow

### 4. Audit Logs (Differentiator)
- ❌ **MISSING**
  - Activity tracking
  - User action logs
  - Exportable records
  - Filter capabilities

### 5. Integrations & API (Table Stakes)
- ❌ **MISSING**
  - API key management
  - Third-party connections
  - SSO configuration
  - Webhook setup

### 6. Branding & White-Label (Differentiator)
- ⚠️ **PARTIAL**
  - Brand Kit exists
  - Need white-label options
  - Custom domain support
  - Client branding

### 7. Feature Toggles (Differentiator)
- ❌ **MISSING**
  - AI feature controls
  - Compliance settings
  - Content filters
  - Beta features

---

## Current Database Schema Analysis

### Existing Models
```prisma
✅ Agency (basic)
  - id, licenseKey, billingActive, planType
  - Relations: users, workspaces, brandKits

✅ User (basic)  
  - id, email, password, agencyId
  - No roles or permissions yet

✅ Workspace (good)
  - Client project structure

✅ BrandKit (good foundation)
  - Colors, fonts, logo, voice
  - Need white-label enhancements
```

### Missing Models (Need to Add)
```prisma
❌ Role
  - Define role hierarchy
  - Custom roles support

❌ Permission
  - Granular permission system
  - Feature-based permissions

❌ UserRole (junction)
  - User-to-role assignments
  - Workspace-specific roles

❌ AuditLog
  - Activity tracking
  - User action history

❌ Integration
  - Third-party connections
  - API keys
  - SSO config

❌ Subscription
  - Billing details
  - Invoice history
  - Seat management

❌ FeatureFlag
  - Feature toggles
  - Per-agency settings
```

---

## Implementation Plan

### Phase 1: Database Schema Extension (High Priority)
**Time**: 3-4 hours

1. **Add Role System**
   ```prisma
   model Role {
     id          String @id @default(cuid())
     name        String // Owner, Admin, Member, Custom
     agencyId    String
     permissions Json   // Permission matrix
     isSystem    Boolean @default(false)
     createdAt   DateTime @default(now())
     
     agency      Agency @relation(...)
     userRoles   UserRole[]
   }
   
   model UserRole {
     id          String @id @default(cuid())
     userId      String
     roleId      String
     workspaceId String? // Workspace-specific role
     grantedAt   DateTime @default(now())
     
     user        User @relation(...)
     role        Role @relation(...)
     workspace   Workspace? @relation(...)
   }
   ```

2. **Add Audit Logging**
   ```prisma
   model AuditLog {
     id          String @id @default(cuid())
     agencyId    String
     userId      String
     action      String // login, create, update, delete, etc.
     entityType  String // workspace, campaign, user, etc.
     entityId    String?
     details     Json?
     ipAddress   String?
     userAgent   String?
     createdAt   DateTime @default(now())
     
     agency      Agency @relation(...)
     user        User @relation(...)
   }
   ```

3. **Add Subscription Management**
   ```prisma
   model Subscription {
     id              String @id @default(cuid())
     agencyId        String @unique
     planId          String
     status          String // active, canceled, past_due, trial
     seats           Int @default(1)
     billingCycle    String // monthly, annual
     currentPeriodStart DateTime
     currentPeriodEnd   DateTime
     cancelAtPeriodEnd  Boolean @default(false)
     trialEndsAt     DateTime?
     createdAt       DateTime @default(now())
     
     agency          Agency @relation(...)
     invoices        Invoice[]
   }
   
   model Invoice {
     id              String @id @default(cuid())
     subscriptionId  String
     amount          Float
     currency        String @default("USD")
     status          String // paid, pending, failed
     paidAt          DateTime?
     dueDate         DateTime
     invoiceUrl      String?
     createdAt       DateTime @default(now())
     
     subscription    Subscription @relation(...)
   }
   ```

4. **Add Integrations**
   ```prisma
   model Integration {
     id          String @id @default(cuid())
     agencyId    String
     type        String // api_key, oauth, sso, webhook
     name        String // "Instagram API", "Zapier", etc.
     config      Json   // API keys, tokens, endpoints
     isActive    Boolean @default(true)
     lastUsedAt  DateTime?
     createdAt   DateTime @default(now())
     
     agency      Agency @relation(...)
   }
   ```

5. **Add Feature Flags**
   ```prisma
   model FeatureFlag {
     id          String @id @default(cuid())
     agencyId    String
     featureKey  String // ai_captions, batch_export, etc.
     isEnabled   Boolean @default(true)
     config      Json?  // Feature-specific config
     updatedAt   DateTime @updatedAt
     
     agency      Agency @relation(...)
     
     @@unique([agencyId, featureKey])
   }
   ```

### Phase 2: Backend API Endpoints (High Priority)
**Time**: 4-5 hours

#### User Management Endpoints
- `POST /api/agency/users/invite` - Invite user
- `GET /api/agency/users` - List all users
- `PATCH /api/agency/users/:id/role` - Update user role
- `DELETE /api/agency/users/:id` - Remove user
- `GET /api/agency/roles` - List roles
- `POST /api/agency/roles` - Create custom role

#### Billing Endpoints
- `GET /api/agency/subscription` - Get subscription details
- `PATCH /api/agency/subscription` - Update subscription
- `POST /api/agency/subscription/seats` - Add/remove seats
- `GET /api/agency/invoices` - List invoices
- `GET /api/agency/invoices/:id/download` - Download invoice

#### Audit Log Endpoints
- `GET /api/agency/audit-logs` - List logs (with filters)
- `GET /api/agency/audit-logs/export` - Export logs

#### Integration Endpoints
- `GET /api/agency/integrations` - List integrations
- `POST /api/agency/integrations` - Add integration
- `PATCH /api/agency/integrations/:id` - Update integration
- `DELETE /api/agency/integrations/:id` - Remove integration

#### Feature Flags Endpoints
- `GET /api/agency/features` - List feature flags
- `PATCH /api/agency/features/:key` - Toggle feature

### Phase 3: Frontend Components (High Priority)
**Time**: 6-8 hours

#### 1. AgencySettings (Main Container)
```tsx
<AgencySettings>
  <Sidebar>
    - General
    - Users & Permissions
    - Billing & Plans
    - Audit Logs
    - Integrations
    - Branding
    - Features
  </Sidebar>
  <Content>
    {/* Dynamic content based on selection */}
  </Content>
</AgencySettings>
```

#### 2. GeneralSettings
- Company name and info
- Agency profile
- Timezone, language
- Contact information

#### 3. UserManagement
- User list with roles
- Invite user modal
- Role assignment
- Permission matrix view
- Remove user flow

#### 4. BillingSettings
- Current plan card
- Seat management
- Billing cycle toggle
- Payment method
- Invoice history table
- Usage metrics

#### 5. AuditLogViewer
- Filterable table
- User filter
- Action filter
- Date range picker
- Export button

#### 6. IntegrationsManager
- Integration cards
- Add integration modal
- API key management
- SSO configuration
- Webhook setup

#### 7. BrandingSettings
- Enhanced BrandKit
- White-label options
- Custom domain
- Logo management
- Client branding

#### 8. FeatureToggles
- Feature list with toggles
- AI features
- Beta features
- Compliance settings
- Content filters

### Phase 4: Permission System (Medium Priority)
**Time**: 3-4 hours

#### Permission Matrix
```typescript
interface PermissionMatrix {
  // Workspace management
  createWorkspace: boolean;
  deleteWorkspace: boolean;
  editWorkspace: boolean;
  
  // Campaign management
  createCampaign: boolean;
  deleteCampaign: boolean;
  approveCampaign: boolean;
  
  // User management
  inviteUsers: boolean;
  removeUsers: boolean;
  assignRoles: boolean;
  
  // Billing
  viewBilling: boolean;
  manageBilling: boolean;
  
  // Settings
  viewSettings: boolean;
  manageSettings: boolean;
  
  // Audit logs
  viewAuditLogs: boolean;
  exportAuditLogs: boolean;
}
```

#### Built-in Roles
- **Owner**: Full access to everything
- **Admin**: All except billing and user removal
- **Member**: Create/edit campaigns, limited settings
- **Viewer**: Read-only access

### Phase 5: UI Integration (Medium Priority)
**Time**: 2-3 hours

1. **Add Settings Link to Header**
   - Gear icon in AgencyHeader
   - Dropdown with "Agency Settings" option

2. **Add Workspace Switcher**
   - Top-left dropdown
   - List all workspaces
   - Quick switch

3. **Add User Menu**
   - Profile dropdown
   - My Profile
   - Agency Settings (if admin)
   - Sign Out

4. **Permission Guards**
   - Hide/disable features based on role
   - Show permission errors
   - Redirect if unauthorized

---

## Deliverables

### Database
- ✅ Extended Prisma schema with 7 new models
- ✅ Migration scripts
- ✅ Seed data for default roles

### Backend
- ✅ 20+ new API endpoints
- ✅ Permission middleware
- ✅ Audit logging middleware
- ✅ Role-based access control

### Frontend
- ✅ AgencySettings main component
- ✅ 8 settings sub-panels
- ✅ User invitation flow
- ✅ Role management UI
- ✅ Billing interface
- ✅ Audit log viewer
- ✅ Integration manager

### Documentation
- ✅ API documentation
- ✅ Permission matrix guide
- ✅ User management guide
- ✅ Billing guide

---

## Priority Breakdown

### Must Have (Table Stakes)
1. User roles and permissions
2. User invitation system
3. Basic billing page
4. Settings UI structure

### Should Have
5. Audit logs
6. API key management
7. Enhanced billing (invoices, seats)
8. Feature toggles

### Nice to Have (Differentiators)
9. Custom roles
10. Advanced audit log filters
11. White-label branding
12. SSO integration
13. Webhook management

---

## Time Estimate

- **Phase 1** (Schema): 3-4 hours
- **Phase 2** (Backend): 4-5 hours
- **Phase 3** (Frontend): 6-8 hours
- **Phase 4** (Permissions): 3-4 hours
- **Phase 5** (Integration): 2-3 hours

**Total**: 18-24 hours (~3-4 days)

---

## Success Criteria

✅ **Table Stakes Met**:
- Multi-user support with roles
- User invitation flow
- Basic billing page
- Settings accessible

✅ **Differentiators Added**:
- Audit logging system
- Granular permissions
- Feature toggles
- Integration management

✅ **UX Excellence**:
- Intuitive navigation
- Clear role hierarchy
- Responsive design
- Consistent with design system

---

## References

- Notion Enterprise: Role hierarchy, audit logs
- Buffer Teams: User management, permissions
- Canva Enterprise: Brand kits, white-label
- Frame.io: Audit logs, integrations
- Hootsuite: Role matrix, SSO

---

*Document created: December 5, 2025*
*Status: Ready for implementation*
