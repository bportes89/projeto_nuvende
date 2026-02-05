import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  balanceBrl: string;
  balanceUsdc: string;
  walletAddress: string | null;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, name: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('nuvende_userId');
    const storedUserRole = localStorage.getItem('nuvende_userRole');
    if (storedUserId) {
      loadUser(storedUserId, storedUserRole || 'USER');
    }
  }, []);

  async function loadUser(userId: string, role: string = 'USER') {
    try {
      // Como não temos endpoint de "me", vamos usar o getBalance e assumir que o usuário existe
      // Na verdade, precisamos do ID para tudo.
      // Vamos fazer um "mock login" criando o usuário se não existir ou apenas buscando o saldo
      // O endpoint GET /users/:id/balance retorna os saldos.
      // O endpoint POST /users cria.
      
      // Simplificação: Se tem ID no storage, buscamos saldo e montamos objeto User parcial
      const { data } = await api.get(`/users/${userId}/balance`);
      setUser({
        id: userId,
        email: 'user@example.com', // Mock, já que o endpoint de balance não retorna email
        name: 'Usuário', // Mock
        balanceBrl: data.balanceBrl,
        balanceUsdc: data.balanceUsdc,
        walletAddress: data.walletAddress,
        role: role
      });
    } catch (error) {
      console.error("Failed to load user", error);
      logout();
    }
  }

  async function login(email: string, name: string, password?: string) {
    try {
      const { data } = await api.post('/users', { email, name, password });
      localStorage.setItem('nuvende_userId', data.id);
      if (data.role) localStorage.setItem('nuvende_userRole', data.role);
      
      setUser({ ...data, balanceBrl: '0', balanceUsdc: '0' });
      // Carrega saldo real
      await loadUser(data.id, data.role);
    } catch (error: any) {
        if (error.response?.status === 409) {
            // Se já existe, precisaríamos de uma forma de "logar" real.
            // Por enquanto, como é MVP sem auth real, vamos assumir que o usuário deve limpar o cache se quiser outro
            alert("Email já cadastrado. No MVP, limpe o cache para criar outro ou implemente login real.");
        }
        throw error;
    }
  }

  function logout() {
    localStorage.removeItem('nuvende_userId');
    localStorage.removeItem('nuvende_userRole');
    setUser(null);
  }

  async function refreshUser() {
    if (user?.id) {
      await loadUser(user.id, user.role);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated: !!user, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
