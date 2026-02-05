import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class UserController {
  async create(req: Request, res: Response) {
    try {
        console.log('[DEBUG] create called');
        console.log('[DEBUG] req.body:', JSON.stringify(req.body));
        
        if (!req.body) {
            console.log('[DEBUG] req.body is missing');
            return res.status(400).json({ error: "Body is missing" });
        }

        const { email: rawEmail, name, password } = req.body;
     
       if (!rawEmail) {
           console.log('[DEBUG] Email is missing');
           return res.status(400).json({error: "Email required"});
       }
       const email = rawEmail.trim().toLowerCase();
       
       console.log(`[Login Attempt] Email: ${email}, Name: ${name || 'N/A'}`);

       // Verifica se usuário já existe
       console.log('[DEBUG] Searching for existing user...');
       let user = null;
       try {
         user = await prisma.user.findFirst({ 
             where: { 
             email: { equals: email, mode: 'insensitive' } 
             } 
         });
         console.log(`[DEBUG] User search result: ${user ? 'Found' : 'Not Found'}`);
       } catch (dbError: any) {
         console.log('[DEBUG] Database search error (LOG):', dbError);
         throw dbError;
       }
 
       if (user) {
          console.log('[DEBUG] User found, verifying password...');
          // Lógica de Login
          if (user.password) {
             if (!password) {
                 console.log('[DEBUG] Password required but not provided');
                 return res.status(401).json({ error: "Senha requerida para este usuário." });
             }
             if (password !== user.password) {
                 console.log('[DEBUG] Invalid password');
                 return res.status(401).json({ error: "Senha incorreta." });
             }
          }
          console.log('[DEBUG] Login successful (existing user)');
          return res.json(user);
       }
 
       // Criação de novo usuário
       try {
         console.log('[DEBUG] Creating new user...');
         user = await prisma.user.create({
           data: { email, name, password },
         });
         console.log(`[User Created] ID: ${user.id}`);
         res.json(user);
       } catch (createError: any) {
         // Tratamento de Race Condition ou Conflito
         if (createError.code === 'P2002') {
             console.log('[Login Race Condition] User created concurrently, fetching again...');
             user = await prisma.user.findUnique({ where: { email } });
             if (!user) throw createError; // Se ainda não achar, é erro real
             
             // Re-verifica senha se necessário
             if (user.password && password && password !== user.password) {
                 return res.status(401).json({ error: "Senha incorreta." });
             }
             return res.json(user);
         }
         throw createError;
       }
 
     } catch (error: any) {
         console.log('Login error details (LOG):', error);
         // Retorna mensagem limpa para o frontend
         res.status(500).json({ error: `Erro interno: ${error.message}` });
     }
   }

  async getBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: String(userId) },
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({
        balanceBrl: user.balanceBrl,
        balanceUsdc: user.balanceUsdc,
        walletAddress: user.walletAddress
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const transactions = await prisma.transaction.findMany({
        where: { userId: String(userId) },
        orderBy: { createdAt: 'desc' },
      });
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllTransactions(req: Request, res: Response) {
    try {
      // In a real app, verify admin role here
      const transactions = await prisma.transaction.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
      try {
          const users = await prisma.user.findMany({
              orderBy: { createdAt: 'desc' }
          });
          res.json(users);
      } catch (error: any) {
          res.status(500).json({ error: error.message });
      }
  }
}
