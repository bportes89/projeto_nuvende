import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { TransactionStatus } from '../utils/enums';
import { WebhookService } from '../services/WebhookService';

const webhookService = new WebhookService();

export class TestController {
  async simulatePixPayment(req: Request, res: Response) {
    try {
      const { pixId } = req.body;
      
      if (!pixId) {
        return res.status(400).json({ error: 'Missing pixId' });
      }

      console.log(`[TEST] Simulating Pix Payment for ID: ${pixId}`);

      // Reutiliza a lógica do Webhook para processar o pagamento
      // O WebhookService espera um payload que contenha pixId, id ou txid e um status
      const transaction = await webhookService.handleEvent({ 
        pixId, 
        status: 'paid' 
      });

      return res.json({ success: true, transaction });
    } catch (error: any) {
      console.error('Simulation Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
