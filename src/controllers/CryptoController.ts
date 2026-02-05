import { Request, Response } from 'express';
import { CryptoService } from '../services/CryptoService';

const cryptoService = new CryptoService();

export class CryptoController {
  async convert(req: Request, res: Response) {
    try {
      const { userId, amountBrl } = req.body;
      if (!userId || !amountBrl) return res.status(400).json({error: "Missing parameters"});
      const result = await cryptoService.convertBrlToUsdc(userId, parseFloat(amountBrl));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async liquidate(req: Request, res: Response) {
    try {
      const { userId, amountUsdc, walletAddress } = req.body;
      if (!userId || !amountUsdc || !walletAddress) return res.status(400).json({error: "Missing parameters"});
      const result = await cryptoService.liquidateOnChain(userId, parseFloat(amountUsdc), walletAddress);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
