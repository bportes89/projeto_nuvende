import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function run() {
  try {
    console.log('--- Iniciando Teste de Fluxo ---');

    // 1. Criar Usuário
    console.log('1. Criando usuário...');
    const userRes = await axios.post(`${API_URL}/users`, {
      email: `test_${Date.now()}@example.com`,
      name: 'Test User'
    });
    const user = userRes.data;
    console.log('Usuário criado:', user.id);

    // 2. Gerar Cobrança Pix
    console.log('2. Gerando cobrança Pix (100.00 BRL)...');
    const chargeRes = await axios.post(`${API_URL}/pix/charge`, {
      userId: user.id,
      amount: 100.00
    });
    const charge = chargeRes.data;
    console.log('Cobrança criada:', charge.id, charge.pixCode);

    // 3. Simular Webhook
    console.log('3. Simulando Webhook Pix (Pagamento)...');
    await axios.post(`${API_URL}/webhook/pix`, {
      pixId: charge.pixId
    });
    console.log('Webhook processado.');

    // 4. Verificar Saldo
    let balanceRes = await axios.get(`${API_URL}/users/${user.id}/balance`);
    console.log('Saldo após depósito:', balanceRes.data);

    // 5. Converter BRL para USDC
    console.log('5. Convertendo 50.00 BRL para USDC...');
    const convertRes = await axios.post(`${API_URL}/convert`, {
      userId: user.id,
      amountBrl: 50.00
    });
    console.log('Conversão realizada:', convertRes.data.amount, 'USDC');

    // 6. Verificar Saldo
    balanceRes = await axios.get(`${API_URL}/users/${user.id}/balance`);
    console.log('Saldo após conversão:', balanceRes.data);

    // 7. Liquidar On-Chain
    console.log('7. Liquidando 5 USDC on-chain...');
    const liquidateRes = await axios.post(`${API_URL}/liquidate`, {
      userId: user.id,
      amountUsdc: 5.0,
      walletAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Liquidação realizada:', liquidateRes.data.txHash);

    // 8. Verificar Saldo
    balanceRes = await axios.get(`${API_URL}/users/${user.id}/balance`);
    console.log('Saldo após liquidação:', balanceRes.data);

    // 9. Solicitar Saque Pix
    console.log('9. Solicitando Saque Pix (10.00 BRL)...');
    const withdrawRes = await axios.post(`${API_URL}/withdraw`, {
      userId: user.id,
      amount: 10.00,
      pixKey: 'test@example.com'
    });
    console.log('Saque solicitado:', withdrawRes.data.id);

    // 10. Verificar Saldo
    balanceRes = await axios.get(`${API_URL}/users/${user.id}/balance`);
    console.log('Saldo após saque:', balanceRes.data);

    console.log('--- Teste Finalizado com Sucesso ---');

  } catch (error: any) {
    console.error('Erro no teste:', error.response?.data || error.message);
  }
}

run();
