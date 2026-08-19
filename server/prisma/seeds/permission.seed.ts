// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../../src/shared/constants/permissions';
import { SYSTEM_ROLES } from '../../src/shared/constants/roles';

const prisma = new PrismaClient();

async function seedPermissions() {
  const permissions = [
    { name: PERMISSIONS.USER_CREATE, description: 'Create new users' },
    { name: PERMISSIONS.USER_READ, description: 'View users' },
    { name: PERMISSIONS.USER_UPDATE, description: 'Update users' },
    { name: PERMISSIONS.USER_DELETE, description: 'Delete users' },
    { name: PERMISSIONS.ROLE_CREATE, description: 'Create new roles' },
    { name: PERMISSIONS.ROLE_READ, description: 'View roles' },
    { name: PERMISSIONS.ROLE_UPDATE, description: 'Update roles' },
    { name: PERMISSIONS.ROLE_DELETE, description: 'Delete roles' },
    { name: PERMISSIONS.PERMISSION_READ, description: 'View permissions' },
    { name: PERMISSIONS.PERMISSION_MANAGE, description: 'Manage permissions' },
    { name: PERMISSIONS.ORG_CREATE, description: 'Create organizations' },
    { name: PERMISSIONS.ORG_READ, description: 'View organizations' },
    { name: PERMISSIONS.ORG_UPDATE, description: 'Update organizations' },
    { name: PERMISSIONS.ORG_DELETE, description: 'Delete organizations' },
    { name: PERMISSIONS.BRANCH_CREATE, description: 'Create branches' },
    { name: PERMISSIONS.BRANCH_READ, description: 'View branches' },
    { name: PERMISSIONS.BRANCH_UPDATE, description: 'Update branches' },
    { name: PERMISSIONS.BRANCH_DELETE, description: 'Delete branches' },
    { name: PERMISSIONS.STUDENT_CREATE, description: 'Create students' },
    { name: PERMISSIONS.STUDENT_READ, description: 'View students' },
    { name: PERMISSIONS.STUDENT_UPDATE, description: 'Update students' },
    { name: PERMISSIONS.STUDENT_DELETE, description: 'Delete students' },
    { name: PERMISSIONS.TEACHER_CREATE, description: 'Create teachers' },
    { name: PERMISSIONS.TEACHER_READ, description: 'View teachers' },
    { name: PERMISSIONS.TEACHER_UPDATE, description: 'Update teachers' },
    { name: PERMISSIONS.TEACHER_DELETE, description: 'Delete teachers' },
    { name: PERMISSIONS.FINANCE_READ, description: 'View financial data' },
    { name: PERMISSIONS.FINANCE_MANAGE, description: 'Manage finances' },
    { name: PERMISSIONS.REPORT_READ, description: 'View reports' },
    { name: PERMISSIONS.REPORT_CREATE, description: 'Create reports' },
    { name: PERMISSIONS.ACADEMIC_READ, description: 'View academic data' },
    { name: PERMISSIONS.ACADEMIC_MANAGE, description: 'Manage academic data' },
  ];

  console.log('📋 Seeding permissions...');
  
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log('✅ Permissions seeded successfully!');
}

async function seedRoles() {
  console.log('👥 Seeding roles...');

  const roles = [
    {
      name: SYSTEM_ROLES.SUPER_ADMIN,
      description: 'Super Administrator - Full system access across all organizations',
    },
    {
      name: SYSTEM_ROLES.ADMIN,
      description: 'Administrator - Full access within their organization',
    },
    {
      name: SYSTEM_ROLES.TEACHER,
      description: 'Teacher - Can manage students, grades, and view reports',
    },
    {
      name: SYSTEM_ROLES.STUDENT,
      description: 'Student - Can view their own information and grades',
    },
  ];

  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));

  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });

    // Delete existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: createdRole.id },
    });

    // Assign permissions based on role
    const rolePermissions = ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS];
    
    if (rolePermissions) {
      const rolePermissionData = rolePermissions
        .map(permName => ({
          roleId: createdRole.id,
          permissionId: permissionMap.get(permName),
        }))
        .filter(data => data.permissionId); // Filter out any undefined permissions

      if (rolePermissionData.length > 0) {
        await prisma.rolePermission.createMany({
          data: rolePermissionData as any,
        });
      }
    }

    console.log(`  ✓ ${role.name} - ${rolePermissions.length} permissions assigned`);
  }

  console.log('✅ Roles seeded successfully!');
}

async function main() {
  console.log('🚀 Starting seed...\n');
  
  await seedPermissions();
  console.log('');
  await seedRoles();
  
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });