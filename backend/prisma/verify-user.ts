import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'farit@academyc.com';
  console.log(`🔍 Checking user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('✅ User found:');
  console.log(`   Status: ${user.status}`);
  console.log(`   IsActive: ${user.isActive}`);
  console.log(`   Roles: ${user.roles.map(r => r.roleId).join(', ')}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
