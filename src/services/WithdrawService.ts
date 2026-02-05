import { prisma } from '../utils/prisma';
import { TransactionType, TransactionStatus } from '../utils/enums';
import { Decimal } from 'decimal.js';
import { NuvendeProvider } from '../providers/NuvendeProvider';

const nuvendeProvider = new NuvendeProvider();

export class WithdrawService {
  async requestWithdraw(userId: string, amount: number, pixKey: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const amountDecimal = new Decimal(amount);

    if (user.balanceBrl.lessThan(amountDecimal)) {
      throw new Error('Insufficient BRL balance');
    }

    // Cria transação de saque e debita saldo (bloqueia fundos)
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          balanceBrl: { decrement: amountDecimal },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAW_PIX,
          amount: amountDecimal,
          status: TransactionStatus.PENDING,
          description: `Withdraw to Pix Key: ${pixKey}`,
        },
      });

      return transaction;
    });

    // Inicia processamento (Real ou Mock)
    this.processWithdraw(result.id, userId, amount, pixKey);

    return result;
  }

  // Processa o saque (Worker Simulado ou Chamada Real)
  private async processWithdraw(transactionId: string, userId: string, amount: number, pixKey: string) {
    // Se tiver credenciais reais, tenta executar o pagamento Pix imediatamente
    if (process.env.NUVENDE_API_KEY || process.env.NUVENDE_CLIENT_ID) {
       try {
         console.log(`Processing Real Withdraw ${transactionId} via Nuvende Provider...`);
         const payment = await nuvendeProvider.sendPixPayment(userId, amount, pixKey);
         
         await prisma.transaction.update({
             where: { id: transactionId },
             data: { 
                 status: TransactionStatus.COMPLETED, 
                 pixId: payment.id || payment.e2eId || `out_pix_${Date.now()}` // ID do pagamento no provedor
             }
         });
         console.log(`Real Withdraw ${transactionId} processed successfully.`);
         return;
       } catch (error) {
           console.error(`Failed to process real withdraw ${transactionId}`, error);
           // Em produção, isso deveria ir para uma fila de retentativa ou DLQ.
           // Aqui, marcamos como FALHA e ESTORNAMOS o saldo para não prejudicar o teste.
           await this.refundWithdraw(transactionId, userId, amount);
           return;
       }
    }

    // Fallback: Simulação Mock
    console.log('Using Mock Withdraw Processing (No NUVENDE_API_KEY or NUVENDE_CLIENT_ID)');
    setTimeout(async () => {
      try {
        await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: TransactionStatus.COMPLETED, pixId: `out_pix_${Date.now()}` }
        });
        console.log(`Mock Withdraw ${transactionId} processed successfully`);
      } catch (e) {
          console.error(`Failed to process mock withdraw ${transactionId}`, e);
          await this.refundWithdraw(transactionId, userId, amount);
      }
    }, 5000); // 5 segundos delay simulado
  }

  private async refundWithdraw(transactionId: string, userId: string, amount: number) {
      console.log(`Refunding withdraw ${transactionId}...`);
      await prisma.$transaction([
          prisma.transaction.update({
              where: { id: transactionId },
              data: { status: TransactionStatus.FAILED }
          }),
          prisma.user.update({
              where: { id: userId },
              data: { balanceBrl: { increment: new Decimal(amount) } }
          })
      ]);
  }
}
