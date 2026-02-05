import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@nuvende.com';
  
  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
        role: 'ADMIN',
        password: 'admin' // Em produção usar hash!
    },
    create: {
      email: adminEmail,
      name: 'Administrador',
      role: 'ADMIN',
      password: 'admin',
      balanceBrl: 1000000,
      balanceUsdc: 500000
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
