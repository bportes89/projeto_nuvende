import { prisma } from '../src/utils/prisma';
import { Decimal } from 'decimal.js';

async function createAdmin() {
  const email = 'admin@nuvende.com';
  const name = 'Administrador';

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`Usuário Admin já existe: ${existingUser.id}`);
      return;
    }

    const admin = await prisma.user.create({
      data: {
        email,
        name,
        balanceBrl: new Decimal(1000000), // 1 milhão de BRL para testes
        balanceUsdc: new Decimal(100000), // 100 mil USDC para testes
        walletAddress: '0xAdminWalletAddressMock123456',
      },
    });

    console.log('--- Conta Admin Criada com Sucesso ---');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Nome: ${admin.name}`);
    console.log(`Saldo BRL: ${admin.balanceBrl}`);
    console.log(`Saldo USDC: ${admin.balanceUsdc}`);
    console.log('--------------------------------------');

  } catch (error) {
    console.error('Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
