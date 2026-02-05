import { Request, Response } from 'express';
import { WithdrawService } from '../services/WithdrawService';

const withdrawService = new WithdrawService();

export class WithdrawController {
  async requestWithdraw(req: Request, res: Response) {
    try {
      const { userId, amount, pixKey } = req.body;
      if (!userId || !amount || !pixKey) return res.status(400).json({error: "Missing parameters"});
      const result = await withdrawService.requestWithdraw(userId, parseFloat(amount), pixKey);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
