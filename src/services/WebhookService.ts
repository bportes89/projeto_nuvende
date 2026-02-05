import { prisma } from '../utils/prisma';
import { TransactionStatus, TransactionType } from '../utils/enums';

export class WebhookService {
    async handleEvent(payload: any) {
        console.log('--- Webhook Received ---');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        // Tenta identificar a transação pelo ID externo (pixId ou id da nuvende)
        // O payload real da Nuvende deve enviar um ID de transação ou Pix ID
        const externalId = payload.id || payload.txid || payload.pixId || payload.data?.id;
        
        // Normaliza o status (assumindo variações comuns)
        const statusRaw = (payload.status || payload.event || '').toLowerCase();
        
        if (!externalId) {
            console.warn('Webhook received without identifiable ID (id, txid, pixId)');
            return { processed: false, reason: 'missing_id' };
        }

        const transaction = await prisma.transaction.findFirst({
            where: { OR: [{ pixId: externalId }, { id: externalId }] }
        });

        if (!transaction) {
             console.warn(`Transaction not found for ID: ${externalId}`);
             return { processed: false, reason: 'transaction_not_found' };
        }

        if (transaction.status === TransactionStatus.COMPLETED || transaction.status === TransactionStatus.FAILED) {
            console.log(`Transaction ${transaction.id} already processed (Status: ${transaction.status}).`);
            return { processed: true, status: transaction.status };
        }

        // --- Lógica de Depósito (Pix In) ---
        if (transaction.type === TransactionType.DEPOSIT_PIX) {
            // Verifica se o evento indica sucesso
            if (statusRaw.includes('paid') || statusRaw.includes('completed') || statusRaw.includes('received') || statusRaw === 'active') {
                 await prisma.$transaction([
                     prisma.transaction.update({
                         where: { id: transaction.id },
                         data: { status: TransactionStatus.COMPLETED }
                     }),
                     prisma.user.update({
                         where: { id: transaction.userId },
                         data: { balanceBrl: { increment: transaction.amount } }
                     })
                 ]);
                 console.log(`Deposit ${transaction.id} CONFIRMED via Webhook.`);
                 return { processed: true, newStatus: TransactionStatus.COMPLETED };
            }
        }

        // --- Lógica de Saque (Pix Out) ---
        if (transaction.type === TransactionType.WITHDRAW_PIX) {
            if (statusRaw.includes('completed') || statusRaw.includes('paid') || statusRaw.includes('success')) {
                 await prisma.transaction.update({
                     where: { id: transaction.id },
                     data: { status: TransactionStatus.COMPLETED }
                 });
                 console.log(`Withdraw ${transaction.id} CONFIRMED via Webhook.`);
                 return { processed: true, newStatus: TransactionStatus.COMPLETED };

            } else if (statusRaw.includes('failed') || statusRaw.includes('rejected') || statusRaw.includes('error')) {
                 // Estorno do saldo em caso de falha no saque
                 await prisma.$transaction([
                     prisma.transaction.update({
                         where: { id: transaction.id },
                         data: { status: TransactionStatus.FAILED }
                     }),
                     prisma.user.update({
                         where: { id: transaction.userId },
                         data: { balanceBrl: { increment: transaction.amount } }
                     })
                 ]);
                 console.log(`Withdraw ${transaction.id} FAILED via Webhook. Refund processed.`);
                 return { processed: true, newStatus: TransactionStatus.FAILED };
            }
        }

        return { processed: false, reason: 'unhandled_status_or_type' };
    }
}