import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🔍 Diagnosticando conexão Blockchain...');

  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !usdcAddress) {
    console.error('❌ Erro: Variáveis de ambiente faltando (.env)');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`✅ Conectado a: ${await provider.getNetwork().then(n => n.name)} (Chain ID: ${await provider.getNetwork().then(n => n.chainId)})`);
    console.log(`🔑 Carteira Admin (Hot Wallet): ${wallet.address}`);

    // Check MATIC Balance
    const balanceWei = await provider.getBalance(wallet.address);
    const balanceMatic = ethers.formatEther(balanceWei);
    console.log(`💰 Saldo Nativo: ${balanceMatic} POL/MATIC`);

    if (parseFloat(balanceMatic) < 0.01) {
      console.warn('⚠️  ALERTA: Saldo de Gás (MATIC) muito baixo! Transações podem falhar.');
    }

    // Check USDC Balance
    const abi = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)", "function symbol() view returns (string)"];
    const contract = new ethers.Contract(usdcAddress, abi, provider);
    
    try {
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const balanceTokenWei = await contract.balanceOf(wallet.address);
        const balanceToken = ethers.formatUnits(balanceTokenWei, decimals);
        
        console.log(`🪙  Saldo Token (${symbol}): ${balanceToken} (Contrato: ${usdcAddress})`);

        if (parseFloat(balanceToken) <= 0) {
            console.error('❌ ERRO CRÍTICO: A Carteira Admin não tem saldo de USDC para enviar aos usuários.');
            console.log('👉 Solução: Envie tokens USDC (Testnet) para o endereço da carteira acima.');
        } else {
            console.log('✅ Carteira pronta para operar!');
        }

    } catch (e) {
        console.error('❌ Erro ao ler contrato USDC. O endereço está correto?');
    }

  } catch (error) {
    console.error('❌ Erro de conexão:', error);
  }
}

main();