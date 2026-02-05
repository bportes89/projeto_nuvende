import { Request, Response } from 'express';
import { PixService } from '../services/PixService';
import { WebhookService } from '../services/WebhookService';

const pixService = new PixService();
const webhookService = new WebhookService();

export class PixController {
  async createCharge(req: Request, res: Response) {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ error: 'Missing userId or amount' });
      }

      const transaction = await pixService.createCharge(userId, parseFloat(amount));
      return res.json(transaction);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      // TODO: Validar assinatura do Webhook usando process.env.NUVENDE_WEBHOOK_SECRET
      // const signature = req.headers['x-nuvende-signature'];
      // if (!validateSignature(signature, req.body)) return res.status(401).send();

      const result = await webhookService.handleEvent(req.body);
      
      return res.json({ status: 'received', result });
    } catch (error) {
      console.error('Webhook Error:', error);
      return res.status(500).json({ error: 'Internal server error processing webhook' });
    }
  }
}
