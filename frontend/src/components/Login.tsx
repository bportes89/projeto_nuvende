import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowRight } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Se for admin, não envia o nome para evitar confusão no backend
      await login(email, isAdminMode ? '' : name, isAdminMode ? password : undefined);
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Network Error') {
         alert('Erro de conexão: O backend parece estar offline.');
      } else if (error.response?.data?.error) {
         // Mensagem de erro vinda do backend
         alert(`Erro: ${error.response.data.error}`);
      } else if (error.response) {
         // Erro genérico com status
         alert(`Erro no servidor (${error.response.status}): ${error.response.statusText}`);
      } else {
         alert('Erro ao entrar: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white p-4">
      {/* Elemento decorativo de fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-nuvende-green/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <div className="bg-nuvende-green/10 p-4 rounded-full">
            <Wallet size={40} className="text-nuvende-green" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">NUVENDE</h1>
          <p className="text-gray-400">
            {isAdminMode ? 'Acesso Administrativo' : 'Acesse seu portfólio digital'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isAdminMode && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome Completo</label>
              <input
                type="text"
                required={!isAdminMode}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#141414] border border-[#333] focus:border-nuvende-green rounded-lg px-4 py-3 text-white outline-none transition placeholder-gray-600"
                placeholder="Digite seu nome"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Corporativo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#141414] border border-[#333] focus:border-nuvende-green rounded-lg px-4 py-3 text-white outline-none transition placeholder-gray-600"
              placeholder="seu@email.com"
            />
          </div>

          {isAdminMode && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Senha de Acesso</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141414] border border-[#333] focus:border-nuvende-green rounded-lg px-4 py-3 text-white outline-none transition placeholder-gray-600"
                placeholder="••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nuvende-green hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2 group mt-4"
          >
            {loading ? 'Acessando...' : (isAdminMode ? 'Entrar como Admin' : 'Entrar na Plataforma')}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                type="button"
                onClick={() => setIsAdminMode(!isAdminMode)}
                className="text-xs text-gray-500 hover:text-nuvende-green transition underline"
            >
                {isAdminMode ? 'Voltar para Login de Usuário' : 'Sou Administrador'}
            </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          &copy; 2024 Nuvende Crypto. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
