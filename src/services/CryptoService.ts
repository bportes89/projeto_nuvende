import { prisma } from '../utils/prisma';
import { TransactionType, TransactionStatus } from '../utils/enums';
import { Decimal } from 'decimal.js';
import { ethers } from 'ethers';

const EXCHANGE_RATE_BRL_USD = 5.0; // 1 USDC = 5 BRL

// ABI mínimo para transferência de ERC20
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)"
];

export class CryptoService {
  async convertBrlToUsdc(userId: string, amountBrl: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const amountBrlDecimal = new Decimal(amountBrl);

    if (user.balanceBrl.lessThan(amountBrlDecimal)) {
      throw new Error('Insufficient BRL balance');
    }

    const amountUsdc = amountBrlDecimal.dividedBy(EXCHANGE_RATE_BRL_USD);

    // Transação atômica: debita BRL, credita USDC, registra transação
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          balanceBrl: { decrement: amountBrlDecimal },
          balanceUsdc: { increment: amountUsdc },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.CONVERT_BRL_TO_USDC,
          amount: amountUsdc, // Registra o valor em USDC obtido
          description: `Converted ${amountBrl} BRL to ${amountUsdc} USDC`,
          status: TransactionStatus.COMPLETED,
        },
      });

      return transaction;
    });

    return result;
  }

  async liquidateOnChain(userId: string, amountUsdc: number, walletAddress: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const amountUsdcDecimal = new Decimal(amountUsdc);

    if (user.balanceUsdc.lessThan(amountUsdcDecimal)) {
      throw new Error('Insufficient USDC balance');
    }

    // Cria transação pendente
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.LIQUIDATE_ONCHAIN,
        amount: amountUsdcDecimal,
        status: TransactionStatus.PENDING,
        description: `Liquidate to ${walletAddress}`,
      },
    });

    try {
      let txHash = '';

      // Verifica se as configurações de Blockchain estão presentes para execução real
      if (process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_PRIVATE_KEY && process.env.USDC_CONTRACT_ADDRESS) {
        console.log('Initiating Real Blockchain Transaction...');
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.USDC_CONTRACT_ADDRESS, ERC20_ABI, wallet);
        
        // USDC geralmente tem 6 decimais
        const amountWei = ethers.parseUnits(amountUsdc.toFixed(6), 6);
        
        const txResponse = await contract.transfer(walletAddress, amountWei);
        console.log(`Transaction sent: ${txResponse.hash}`);
        txHash = txResponse.hash;
        
        // Opcional: Aguardar confirmação (pode demorar, talvez seja melhor fazer em background)
        // await txResponse.wait(); 
      } else {
        console.log('Using Mock Blockchain Simulation (Missing .env keys)');
        txHash = `0x${Math.random().toString(16).substring(2).repeat(4)}`; // Mock hash
      }
      
      // Atualiza sucesso (Debita saldo e marca completed)
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            balanceUsdc: { decrement: amountUsdcDecimal },
          },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.COMPLETED,
            txHash: txHash,
          },
        });
      });

      return { ...transaction, status: TransactionStatus.COMPLETED, txHash: txHash };
    } catch (error) {
       console.error('Blockchain Error:', error);
       await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED },
       });
       throw error;
    }
  }
}
