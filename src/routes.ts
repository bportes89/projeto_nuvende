import { Router } from 'express';
import { PixController } from './controllers/PixController';
import { UserController } from './controllers/UserController';
import { CryptoController } from './controllers/CryptoController';
import { WithdrawController } from './controllers/WithdrawController';
import { TestController } from './controllers/TestController';

const router = Router();

const pixController = new PixController();
const userController = new UserController();
const cryptoController = new CryptoController();
const withdrawController = new WithdrawController();
const testController = new TestController();

// User
router.post('/users', userController.create);
router.get('/users/:userId/balance', userController.getBalance);
router.get('/users/:userId/transactions', userController.getTransactions);

// Admin
router.get('/admin/transactions', userController.getAllTransactions);
router.get('/admin/users', userController.getAllUsers);

// Pix In
router.post('/pix/charge', pixController.createCharge.bind(pixController));
router.post('/webhook/pix', pixController.handleWebhook.bind(pixController));

// Crypto
router.post('/convert', cryptoController.convert.bind(cryptoController));
router.post('/liquidate', cryptoController.liquidate.bind(cryptoController));

// Pix Out
router.post('/withdraw', withdrawController.requestWithdraw.bind(withdrawController));

// Test / Simulation
router.post('/test/simulate-pix', testController.simulatePixPayment.bind(testController));

export default router;
