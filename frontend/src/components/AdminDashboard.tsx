import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function AdminDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data } = await api.get('/admin/transactions');
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions', error);
      alert('Erro ao carregar transações. Verifique se você é Admin.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-500 bg-green-500/10';
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10';
      case 'FAILED': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Painel Administrativo</h2>
        <button 
          onClick={loadTransactions}
          className="px-4 py-2 bg-[#252525] hover:bg-[#333] rounded-lg text-sm text-gray-300 transition"
        >
          Atualizar
        </button>
      </div>

      {/* Stats Cards (Mockup for now) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#333]">
           <h3 className="text-gray-500 text-sm font-medium mb-2">Total Transacionado</h3>
           <p className="text-3xl font-bold text-white">R$ {transactions.reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}</p>
        </div>
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#333]">
           <h3 className="text-gray-500 text-sm font-medium mb-2">Transações Totais</h3>
           <p className="text-3xl font-bold text-white">{transactions.length}</p>
        </div>
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#333]">
           <h3 className="text-gray-500 text-sm font-medium mb-2">Usuários Ativos</h3>
           <p className="text-3xl font-bold text-white">-</p>
        </div>
      </div>

      <div className="bg-[#1e1e1e] border border-[#333] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#333]">
          <h3 className="font-bold text-lg text-white">Todas as Transações</h3>
        </div>
        
        {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-[#141414] text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 border-b border-[#333]">Data</th>
                    <th className="p-4 border-b border-[#333]">Usuário</th>
                    <th className="p-4 border-b border-[#333]">Tipo</th>
                    <th className="p-4 border-b border-[#333]">Valor</th>
                    <th className="p-4 border-b border-[#333]">Status</th>
                    <th className="p-4 border-b border-[#333]">Hash / ID</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#333] text-sm text-gray-300">
                {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#252525] transition">
                    <td className="p-4 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} <span className="text-gray-600 text-xs">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4 font-medium text-white">
                        {tx.user?.name || 'Unknown'}
                        <div className="text-xs text-gray-500">{tx.user?.email}</div>
                    </td>
                    <td className="p-4">
                        <span className="capitalize">{tx.type}</span>
                    </td>
                    <td className="p-4 font-mono">
                        {tx.type === 'LIQUIDATION' ? '$' : 'R$'} {Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(tx.status)}`}>
                        {tx.status === 'COMPLETED' && <CheckCircle size={12} />}
                        {tx.status === 'PENDING' && <Clock size={12} />}
                        {tx.status === 'FAILED' && <XCircle size={12} />}
                        {tx.status}
                        </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500 max-w-[150px] truncate" title={tx.txHash || tx.pixId}>
                        {tx.txHash || tx.pixId || '-'}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
}