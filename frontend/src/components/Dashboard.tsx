import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AdminDashboard } from './AdminDashboard';
import { ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, LogOut, Wallet, RefreshCw, ChevronRight, LayoutDashboard, History, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Componente de botão de ação (Card de Operação)
const OperationCard = ({ icon, label, description, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-start justify-between p-6 rounded-xl transition-all duration-300 border text-left h-40 w-full
      ${active 
        ? 'bg-gradient-to-br from-nuvende-green to-green-900 border-green-500 shadow-lg shadow-green-900/20 transform scale-[1.02]' 
        : 'bg-[#1e1e1e] border-[#333] hover:border-gray-500 hover:bg-[#252525] text-gray-300 hover:text-white'}
    `}
  >
    <div className={`p-3 rounded-lg ${active ? 'bg-white/20 text-white' : 'bg-[#141414] text-nuvende-green'}`}>
      {icon}
    </div>
    <div>
      <h3 className={`font-bold text-lg ${active ? 'text-white' : 'text-gray-200'}`}>{label}</h3>
      <p className={`text-xs mt-1 ${active ? 'text-green-100' : 'text-gray-500'}`}>{description}</p>
    </div>
  </button>
);

export function Dashboard() {
  const { user, logout, refreshUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposit' | 'convert' | 'liquidate' | 'withdraw' | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'wallet' | 'history' | 'admin'>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (activeView === 'history' && user?.id) {
      api.get(`/users/${user.id}/transactions`)
        .then(response => setTransactions(response.data))
        .catch(err => console.error('Erro ao buscar transações', err));
    }
  }, [activeView, user?.id]);
  
  // States para formulários
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Handlers
  const handleSimulatePayment = async () => {
      if (!result?.pixId) return;
      try {
          // Usa o endpoint de simulação específico para testes
          await api.post('/test/simulate-pix', { pixId: result.pixId });
          // O polling existente (checkInterval) irá detectar a conclusão e atualizar a tela
          alert('Simulação enviada! Aguarde a confirmação automática...');
      } catch (e) {
          console.error(e);
          alert('Erro ao enviar simulação.');
      }
  };

  const handleDeposit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/pix/charge', { userId: user?.id, amount: parseFloat(amount) });
      // Map backend response (pixCode) to frontend expectation (qrCode) if needed
      const resultData = {
          ...data,
          qrCode: data.qrCode || data.pixCode // Fallback for compatibility
      };
      setResult(resultData);
      
      // Inicia Polling para verificar status (compatível com localhost e produção)
      const checkInterval = setInterval(async () => {
          try {
              const txRes = await api.get(`/users/${user?.id}/transactions`);
              const tx = txRes.data.find((t: any) => t.id === data.id);
              
              if (tx && tx.status === 'COMPLETED') {
                  clearInterval(checkInterval);
                  await refreshUser();
                  alert('Depósito confirmado!');
                  setResult(null); // Limpa QR Code
                  setActiveView('overview');
              }
          } catch (err) {
              console.error('Polling error', err);
          }
      }, 3000); // Checa a cada 3 segundos

    } catch (e) {
      alert('Erro ao gerar Pix');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      await api.post('/convert', { userId: user?.id, amountBrl: parseFloat(amount) });
      await refreshUser();
      alert('Conversão realizada com sucesso!');
      setAmount('');
    } catch (e) {
      alert('Erro na conversão. Verifique o saldo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidate = async () => {
    const address = (document.getElementById('wallet-address') as HTMLInputElement)?.value;
    if(!address) return alert('Endereço da carteira obrigatório');

    setLoading(true);
    try {
      const { data } = await api.post('/liquidate', { 
        userId: user?.id, 
        amountUsdc: parseFloat(amount),
        walletAddress: address
      });
      await refreshUser();
      setResult(data);
      alert(`Liquidação iniciada! TxHash: ${data.txHash}`);
    } catch (e) {
      alert('Erro na liquidação.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const pixKey = (document.getElementById('pix-key') as HTMLInputElement)?.value;
    if(!pixKey) return alert('Chave Pix obrigatória');

    setLoading(true);
    try {
      await api.post('/withdraw', { 
        userId: user?.id, 
        amount: parseFloat(amount),
        pixKey
      });
      await refreshUser();
      alert('Saque solicitado!');
      setAmount('');
    } catch (e) {
      alert('Erro ao solicitar saque.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-nuvende-green selection:text-white pb-20">
      
      {/* Navbar Minimalista */}
      <header className="sticky top-0 w-full z-50 bg-[#141414]/95 backdrop-blur-sm border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-nuvende-green p-1.5 rounded">
              <Wallet size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">NUVENDE</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
            <button onClick={() => setActiveView('overview')} className={`${activeView === 'overview' ? 'text-white' : 'hover:text-white'} transition`}>Visão Geral</button>
            <button onClick={() => setActiveView('wallet')} className={`${activeView === 'wallet' ? 'text-white' : 'hover:text-white'} transition`}>Carteira</button>
            <button onClick={() => setActiveView('history')} className={`${activeView === 'history' ? 'text-white' : 'hover:text-white'} transition`}>Histórico</button>
            {isAdmin && (
                <button 
                  onClick={() => setActiveView('admin')} 
                  className={`${activeView === 'admin' ? 'text-nuvende-green font-bold' : 'text-gray-400 hover:text-white'} transition`}
                >
                  Painel Admin
                </button>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 flex items-center gap-2 justify-end">
                Olá, {user?.name}
                {isAdmin && <span className="bg-nuvende-green text-black px-2 py-0.5 rounded text-[10px] font-bold">ADMIN</span>}
            </p>
          </div>
          <button onClick={logout} className="p-2 hover:bg-[#333] rounded-full transition text-gray-400 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        
        {activeView === 'admin' && isAdmin ? (
           <AdminDashboard />
        ) : activeView === 'overview' ? (
          <>
            {/* Hero Section - Dashboard Financeiro */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-400 font-medium mb-1">Patrimônio Total Estimado</h2>
              <div className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                R$ {Number(user?.balanceBrl).toFixed(2)}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="bg-[#252525] px-4 py-2 rounded-lg border border-[#333] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-400">BRL Disponível:</span>
                <span className="font-bold text-white">R$ {Number(user?.balanceBrl).toFixed(2)}</span>
              </div>
              <div className="bg-[#252525] px-4 py-2 rounded-lg border border-[#333] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-400">USDC (Polygon):</span>
                <span className="font-bold text-white">$ {Number(user?.balanceUsdc).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Mini Gráfico Decorativo (CSS puro) */}
          <div className="hidden md:flex justify-end">
             <div className="w-full max-w-sm bg-gradient-to-tr from-[#1e1e1e] to-[#252525] p-6 rounded-2xl border border-[#333] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Wallet size={120} />
                </div>
                <h3 className="text-gray-400 text-sm mb-4">Performance (Simulada)</h3>
                <div className="flex items-end gap-2 h-32 w-full">
                   <div className="w-1/5 bg-gray-700 h-[40%] rounded-t-sm"></div>
                   <div className="w-1/5 bg-gray-700 h-[60%] rounded-t-sm"></div>
                   <div className="w-1/5 bg-gray-600 h-[50%] rounded-t-sm"></div>
                   <div className="w-1/5 bg-gray-600 h-[75%] rounded-t-sm"></div>
                   <div className="w-1/5 bg-nuvende-green h-[90%] rounded-t-sm relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded">
                        +12%
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Menu de Operações */}
        <section>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-nuvende-green" />
            Central de Operações
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OperationCard 
              icon={<ArrowDownCircle size={24} />} 
              label="Depositar" 
              description="Adicionar fundos via Pix"
              active={activeTab === 'deposit'} 
              onClick={() => { setActiveTab('deposit'); resetForm(); }} 
            />
            <OperationCard 
              icon={<RefreshCw size={24} />} 
              label="Converter" 
              description="Trocar BRL por USDC"
              active={activeTab === 'convert'} 
              onClick={() => { setActiveTab('convert'); resetForm(); }} 
            />
            <OperationCard 
              icon={<ArrowRightLeft size={24} />} 
              label="Liquidar" 
              description="Enviar USDC para carteira"
              active={activeTab === 'liquidate'} 
              onClick={() => { setActiveTab('liquidate'); resetForm(); }} 
            />
            <OperationCard 
              icon={<ArrowUpCircle size={24} />} 
              label="Sacar" 
              description="Retirar para conta bancária"
              active={activeTab === 'withdraw'} 
              onClick={() => { setActiveTab('withdraw'); resetForm(); }} 
            />
          </div>
        </section>

        {/* Área de Execução (Expansível) */}
        {activeTab && (
          <section className="animate-fade-in">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-6 md:p-10 shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Formulário */}
                <div className="flex-1 max-w-xl">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    {activeTab === 'deposit' && <ArrowDownCircle className="text-nuvende-green" />}
                    {activeTab === 'convert' && <RefreshCw className="text-nuvende-green" />}
                    {activeTab === 'liquidate' && <ArrowRightLeft className="text-nuvende-green" />}
                    {activeTab === 'withdraw' && <ArrowUpCircle className="text-nuvende-green" />}
                    
                    <span>
                      {activeTab === 'deposit' && 'Depositar via Pix'}
                      {activeTab === 'convert' && 'Converter BRL para USDC'}
                      {activeTab === 'liquidate' && 'Liquidar USDC'}
                      {activeTab === 'withdraw' && 'Solicitar Saque'}
                    </span>
                  </h2>
                  <p className="text-gray-400 mb-8">
                     {activeTab === 'deposit' && 'Seu saldo será atualizado automaticamente após o pagamento.'}
                     {activeTab === 'convert' && 'Taxa de câmbio atualizada em tempo real. Sem taxas ocultas.'}
                     {activeTab === 'liquidate' && 'Transferência direta para sua carteira on-chain (Polygon).'}
                     {activeTab === 'withdraw' && 'O valor será enviado para a chave Pix informada em instantes.'}
                  </p>

                  {!result ? (
                    <div className="space-y-6">
                       <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Valor da Operação</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                              {activeTab === 'liquidate' ? 'USDC' : 'R$'}
                            </span>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full bg-[#141414] border border-[#333] focus:border-nuvende-green rounded-lg p-4 pl-12 text-white outline-none transition text-lg"
                              placeholder="0.00"
                            />
                          </div>
                       </div>

                       {activeTab === 'liquidate' && (
                          <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">Endereço da Carteira (Polygon)</label>
                             <input id="wallet-address" type="text" className="w-full bg-[#141414] border border-[#333] focus:border-nuvende-green rounded-lg p-4 text-white outline-none transition font-mono text-sm" placeholder="0x..." />
                          </div>
                        )}

                        {activeTab === 'withdraw' && (
                          <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">Chave Pix de Destino</label>
                             <input id="pix-key" type="text" className="w-full bg-[#141414] border border-[#333] focus:border-nuvende-green rounded-lg p-4 text-white outline-none transition" placeholder="CPF, Email ou Aleatória" />
                          </div>
                        )}

                        <div className="pt-4">
                          <button
                            onClick={() => {
                              if (activeTab === 'deposit') handleDeposit();
                              if (activeTab === 'convert') handleConvert();
                              if (activeTab === 'liquidate') handleLiquidate();
                              if (activeTab === 'withdraw') handleWithdraw();
                            }}
                            disabled={loading || !amount}
                            className="w-full bg-nuvende-green hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg shadow-lg shadow-green-900/30"
                          >
                             {loading && <RefreshCw className="animate-spin" size={20} />}
                             {loading ? 'Processando...' : 'Confirmar Operação'}
                          </button>
                        </div>
                    </div>
                  ) : (
                    <div className="bg-[#141414] p-8 rounded-xl border border-gray-800 text-center animate-fade-in">
                      {activeTab === 'deposit' && result.qrCode && (
                        <div className="flex flex-col items-center">
                          <div className="bg-white p-4 rounded-lg mb-6">
                            <QRCodeSVG value={result.qrCode} size={180} />
                          </div>
                          <p className="text-sm text-gray-500 font-mono break-all max-w-xs mb-4 select-all">{result.qrCode}</p>
                          <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-full mb-6">
                             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                             Aguardando pagamento...
                          </div>

                          {/* Simulação Manual */}
                          <div className="w-full max-w-sm bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg">
                              <p className="text-yellow-500 text-xs mb-3 text-left">
                                  ⚠️ <strong>Ambiente de Teste:</strong> O pagamento real está desabilitado. Utilize o botão abaixo para simular a confirmação bancária.
                              </p>
                              <button 
                                  onClick={handleSimulatePayment}
                                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded transition text-sm flex items-center justify-center gap-2"
                              >
                                  Simular Pagamento Agora
                              </button>
                          </div>
                        </div>
                      )}
                      
                      {activeTab === 'liquidate' && (
                        <div>
                          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                             <ArrowRightLeft size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Liquidação Iniciada!</h3>
                          <p className="text-gray-400 text-sm mb-4">Sua transação está sendo processada na blockchain.</p>
                          <div className="bg-[#000] p-3 rounded border border-gray-800 font-mono text-xs text-gray-300 break-all">
                             {result.txHash}
                          </div>
                        </div>
                      )}

                      <button onClick={resetForm} className="mt-8 text-gray-400 hover:text-white text-sm font-medium hover:underline">
                        Realizar nova operação
                      </button>
                    </div>
                  )}
                </div>

                {/* Info Lateral / Contexto */}
                <div className="hidden lg:block w-80 border-l border-[#333] pl-12">
                   <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Resumo da Conta</h4>
                   <ul className="space-y-6">
                      <li className="flex items-start gap-3">
                         <div className="bg-[#252525] p-2 rounded text-gray-300"><History size={16} /></div>
                         <div>
                            <p className="text-white font-medium">Último Acesso</p>
                            <p className="text-xs text-gray-500">Hoje, às 14:30</p>
                         </div>
                      </li>
                      <li className="flex items-start gap-3">
                         <div className="bg-[#252525] p-2 rounded text-gray-300"><LayoutDashboard size={16} /></div>
                         <div>
                            <p className="text-white font-medium">Status da Conta</p>
                            <p className="text-xs text-green-500">Verificada e Ativa</p>
                         </div>
                      </li>
                   </ul>

                   <div className="mt-12 p-4 bg-[#252525] rounded-lg border border-[#333]">
                      <p className="text-xs text-gray-400 leading-relaxed">
                         <strong className="text-white block mb-1">Precisa de ajuda?</strong>
                         Nosso suporte funciona 24/7 para auxiliar em suas operações cripto.
                      </p>
                   </div>
                </div>

              </div>
            </div>
          </section>
        )}
          </>
        ) : null}

        {activeView === 'wallet' && (
          <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wallet className="text-nuvende-green" />
                Minha Carteira
             </h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] p-8 rounded-xl border border-[#333] relative overflow-hidden">
                   <div className="absolute -right-10 -top-10 opacity-5">
                      <div className="w-64 h-64 rounded-full bg-green-500 blur-3xl"></div>
                   </div>
                   <h3 className="text-gray-400 font-medium mb-2">Saldo em Reais (BRL)</h3>
                   <div className="text-4xl font-bold text-white mb-4">R$ {Number(user?.balanceBrl).toFixed(2)}</div>
                   <p className="text-sm text-gray-500">Disponível para conversão imediata.</p>
                </div>

                <div className="bg-[#1e1e1e] p-8 rounded-xl border border-[#333] relative overflow-hidden">
                   <div className="absolute -right-10 -top-10 opacity-5">
                      <div className="w-64 h-64 rounded-full bg-blue-500 blur-3xl"></div>
                   </div>
                   <h3 className="text-gray-400 font-medium mb-2">Saldo em Dólar (USDC)</h3>
                   <div className="text-4xl font-bold text-white mb-4">$ {Number(user?.balanceUsdc).toFixed(2)}</div>
                   <p className="text-sm text-gray-500">Blockchain: Polygon Amoy Testnet</p>
                </div>
             </div>

             <div className="bg-[#1e1e1e] p-8 rounded-xl border border-[#333]">
                <h3 className="text-lg font-bold text-white mb-4">Detalhes da Conta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                   <div>
                      <p className="text-gray-500 mb-1">Nome do Titular</p>
                      <p className="text-white font-medium">{user?.name}</p>
                   </div>
                   <div>
                      <p className="text-gray-500 mb-1">E-mail</p>
                      <p className="text-white font-medium">{user?.email}</p>
                   </div>
                   <div className="col-span-1 md:col-span-2">
                      <p className="text-gray-500 mb-1">Endereço de Depósito (Interno)</p>
                      <p className="text-white font-mono bg-[#141414] p-3 rounded border border-[#333] break-all">
                        {user?.walletAddress || 'Carteira não gerada'}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <History className="text-nuvende-green" />
                Histórico de Transações
             </h2>

             <div className="bg-[#1e1e1e] rounded-xl border border-[#333] overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-gray-400">
                      <thead className="bg-[#252525] text-gray-200 uppercase font-medium">
                         <tr>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Hash</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-[#333]">
                         {transactions.length > 0 ? (
                           transactions.map((tx) => (
                             <tr key={tx.id} className="hover:bg-[#252525] transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                   {new Date(tx.createdAt).toLocaleDateString('pt-BR')} <br/>
                                   <span className="text-xs text-gray-600">{new Date(tx.createdAt).toLocaleTimeString('pt-BR')}</span>
                                </td>
                                <td className="px-6 py-4">
                                   <span className={`px-2 py-1 rounded text-xs font-bold border
                                      ${tx.type.includes('DEPOSIT') ? 'bg-green-900/30 text-green-400 border-green-900' : ''}
                                      ${tx.type.includes('WITHDRAW') ? 'bg-red-900/30 text-red-400 border-red-900' : ''}
                                      ${tx.type.includes('CONVERT') ? 'bg-blue-900/30 text-blue-400 border-blue-900' : ''}
                                      ${tx.type.includes('LIQUIDATE') ? 'bg-purple-900/30 text-purple-400 border-purple-900' : ''}
                                   `}>
                                      {tx.type.replace(/_/g, ' ')}
                                   </span>
                                </td>
                                <td className="px-6 py-4">{tx.description}</td>
                                <td className="px-6 py-4 font-mono text-white">
                                   {tx.amount}
                                </td>
                                <td className="px-6 py-4">
                                   <span className={`flex items-center gap-1
                                      ${tx.status === 'COMPLETED' ? 'text-green-500' : ''}
                                      ${tx.status === 'PENDING' ? 'text-yellow-500' : ''}
                                      ${tx.status === 'FAILED' ? 'text-red-500' : ''}
                                   `}>
                                      {tx.status === 'COMPLETED' && '● Sucesso'}
                                      {tx.status === 'PENDING' && '● Pendente'}
                                      {tx.status === 'FAILED' && '● Falha'}
                                   </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">
                                   {tx.txHash ? (
                                      <a href={`https://amoy.polygonscan.com/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                                         {tx.txHash.substring(0, 6)}...{tx.txHash.substring(tx.txHash.length - 4)}
                                      </a>
                                   ) : '-'}
                                </td>
                             </tr>
                           ))
                         ) : (
                           <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                 <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                 Nenhuma transação encontrada.
                              </td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </main>

    </div>
  );
}
