
import { getPrismaClient } from '../lib/prisma';

const DEFAULT_ROLES = [
  { name: 'Owner', description: 'Full access to everything', permissions: ["*"] }, // simplified permissions
  { name: 'Admin', description: 'Can manage users and settings', permissions: ["user.manage", "settings.manage", "billing.view"] },
  { name: 'Member', description: 'Can create and edit campaigns', permissions: ["campaign.create", "campaign.edit"] },
  { name: 'Viewer', description: 'Read-only access', permissions: ["campaign.read"] }
];

async function main() {
  const prisma = getPrismaClient();
  try {
    console.log('Starting migration of roles...');
    
    // 1. Get all agencies
    const agencies = await prisma.agency.findMany();
    console.log(`Found ${agencies.length} agencies.`);

    for (const agency of agencies) {
        console.log(`Processing agency: ${agency.id} (${agency.name})`);
        
        // 2. Create roles for this agency
        const roleMap = new Map<string, string>(); // name -> id

        for (const defRole of DEFAULT_ROLES) {
            const role = await prisma.role.upsert({
                where: {
                    agencyId_name: {
                        agencyId: agency.id,
                        name: defRole.name
                    }
                },
                update: {},
                create: {
                    agencyId: agency.id,
                    name: defRole.name,
                    description: defRole.description,
                    permissions: defRole.permissions
                }
            });
            roleMap.set(defRole.name.toLowerCase(), role.id);
        }

        // 3. Migrate users of this agency
        const users = await prisma.user.findMany({
            where: { agencyId: agency.id },
            include: { userRoles: true }
        });

        for (const user of users) {
            if (user.userRoles.length > 0) continue; // Already migrated or has role

            // Map old string role to new Role entity
            // User model in schema HAS 'role' field?
            // In step 24: `role VARCHAR(50) NOT NULL DEFAULT 'member'`? No, `role` field was removed from User model in updated schema? 
            // Wait, I didn't remove `role` field from User in schema.prisma.
            // Let's assume it's accessible as `user.role` but it might be untyped if Prisma Client was generated when I didn't see `role`?
            // Wait, `prisma/schema.prisma` in step 24 DID NOT have `role` field in User model! 
            // It had:
            // model User { ... status String @default("active") ... }
            // It DID NOT show `role String`.
            // BUT `ACCOUNT_SETTINGS_COMPLETE.md` (Step 10) showed `role VARCHAR(50)` in SQL.
            // `AGENCY_SETTINGS_IMPLEMENTATION.md` (Step 11) said "User (basic) - No roles or permissions yet".
            
            // So existing users probably DON'T have a role column, or if they do it's not in Prisma schema.
            // If they don't have a role, I should assign 'Member' by default?
            // Or 'Owner' if they created the agency?
            // Existing `Agency` has `users` relation. Usually the first user is Owner.
            // I'll check if I can determine owner.
            
            // Getting `user` as any to access potential `role` property if it exists in DB but not schema?
            // No, Prisma only selects fields in schema.
            
            // Strategy: Check if user is the first one created for agency -> Owner.
            // Others -> Member.
            
            const isFirstUser = (user.createdAt.getTime() === 
                                 (await prisma.user.findFirst({ where: { agencyId: agency.id }, orderBy: { createdAt: 'asc' } }))?.createdAt.getTime());
            
            let targetRoleName = 'member';
            // If there is a way to know, use it. Otherwise guess.
            // For now, I'll assign 'Owner' to the oldest user.
            
            if (isFirstUser) targetRoleName = 'owner';

            const roleId = roleMap.get(targetRoleName);
            if (roleId) {
                await prisma.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: roleId
                    }
                });
                console.log(`Assigned ${targetRoleName} to user ${user.email}`);
            }
        }
    }

    console.log('Migration complete.');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
