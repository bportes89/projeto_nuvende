import { prisma } from '../utils/prisma';
import { TransactionType, TransactionStatus } from '../utils/enums';
import { Decimal } from 'decimal.js';
import { NuvendeProvider } from '../providers/NuvendeProvider';

const nuvendeProvider = new NuvendeProvider();

export class PixService {
  async createCharge(userId: string, amount: number) {
    let pixId = `pix_${Date.now()}`;
    let pixCode = '';

    // Se houver chave de API ou Client ID configurado, tenta gerar Pix real
    if (process.env.NUVENDE_API_KEY || process.env.NUVENDE_CLIENT_ID) {
      try {
        console.log('Generating Real Pix Charge via Nuvende Provider...');
        const nuvendeCharge = await nuvendeProvider.createPixCharge(userId, amount);
        
        // Mapear resposta real (ajustar campos conforme API real - geralmente txid e pixCopiaECola)
        pixId = nuvendeCharge.txid || nuvendeCharge.id || pixId;
        pixCode = nuvendeCharge.pixCopiaECola || nuvendeCharge.brcode || '';
      } catch (error) {
        console.error('Failed to generate real Pix, falling back to local generation:', error);
      }
    } else {
        console.log('Using Local Pix Generation (No NUVENDE_API_KEY or NUVENDE_CLIENT_ID)');
    }

    // Se não gerou via API (falha ou falta de config), gera um Pix estático válido localmente
    if (!pixCode) {
        pixCode = this.generateStaticPixCode(amount, pixId);
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.DEPOSIT_PIX,
        amount: new Decimal(amount),
        status: TransactionStatus.PENDING,
        pixId,
        pixCode,
      },
    });

    return transaction;
  }

  private generateStaticPixCode(amount: number, txId: string): string {
    const pixKey = process.env.NUVENDE_PIX_KEY || 'b911e9ae-cf02-47ca-8390-a7f1fc41898f'; // Chave Pix
    const merchantName = 'Nuvende Test';
    const merchantCity = 'Brasilia';
    const amountStr = amount.toFixed(2);

    const formatField = (id: string, value: string) => {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
    };

    const payloadKey = formatField('00', 'BR.GOV.BCB.PIX') + formatField('01', pixKey);

    let payload = formatField('00', '01'); // Payload Format Indicator
    payload += formatField('26', payloadKey); // Merchant Account Info
    payload += formatField('52', '0000'); // Merchant Category Code
    payload += formatField('53', '986'); // Transaction Currency (BRL)
    payload += formatField('54', amountStr); // Transaction Amount
    payload += formatField('58', 'BR'); // Country Code
    payload += formatField('59', merchantName); // Merchant Name
    payload += formatField('60', merchantCity); // Merchant City
    
    // Additional Data Field Template (TxID)
    // TxID deve ter até 25 caracteres para compatibilidade
    const cleanTxId = txId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25);
    payload += formatField('62', formatField('05', cleanTxId)); 

    payload += '6304'; // CRC16 ID + Length

    const crc = this.crc16ccitt(payload);
    return payload + crc;
  }

  private crc16ccitt(text: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < text.length; i++) {
        let c = text.charCodeAt(i);
        crc ^= c << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  async processWebhook(pixId: string) {
    // Encontra a transação
    const transaction = await prisma.transaction.findFirst({
      where: { pixId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      return transaction; // Já processado
    }

    // Atualiza status e saldo do usuário
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          balanceBrl: { increment: transaction.amount },
        },
      });

      return t;
    });

    return updatedTransaction;
  }
}
