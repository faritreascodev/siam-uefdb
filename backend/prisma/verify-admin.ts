import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@academyc.com';
  const password = 'Admin123!';

  console.log(`🔍 Checking user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    console.log('❌ User not found in database!');
    return;
  }

  console.log('✅ User found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Status: ${user.status}`);
  console.log(`   IsActive: ${user.isActive}`);
  console.log(`   Roles: ${user.roles.map(r => r.role.name).join(', ')}`);
  
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(`🔐 Password correct? ${isMatch ? 'YES ✅' : 'NO ❌'}`);

  if (!isMatch) {
    console.log('   Expected password: Admin123!');
    // Allow re-hashing to fix if needed (optional)
    // const newHash = await bcrypt.hash(password, 10);
    // await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
    // console.log('   🛠️ Password reset to Admin123!');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
