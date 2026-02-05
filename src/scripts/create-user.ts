import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nuvende.com.br';
  const name = 'Admin Nuvende';

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`Creating new admin user: ${email}`);
    user = await prisma.user.create({
      data: {
        email,
        name,
        balanceBrl: new Decimal(5000.00), // R$ 5.000,00 de saldo inicial
        balanceUsdc: new Decimal(1000.00), // $ 1.000,00 USDC
      },
    });
  } else {
    console.log(`Updating existing admin user: ${email}`);
    // Opcional: Recarregar saldo se estiver zerado
    user = await prisma.user.update({
        where: { email },
        data: {
            balanceBrl: new Decimal(5000.00),
            balanceUsdc: new Decimal(1000.00)
        }
    });
  }

  console.log('\n✅ User Ready for Testing:');
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Balance BRL: R$ ${user.balanceBrl.toFixed(2)}`);
  console.log(`Balance USDC: $ ${user.balanceUsdc.toFixed(2)}`);
  console.log('\n(No password required, just enter the email in the login screen)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
