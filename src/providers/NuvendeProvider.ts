import axios, { AxiosInstance } from 'axios';

export class NuvendeProvider {
  private api: AxiosInstance;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NUVENDE_API_URL || 'https://api.nuvende.com.br/v1',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para adicionar Token automaticamente
    this.api.interceptors.request.use(async (config) => {
        if (!config.url?.includes('/oauth/token')) {
            const token = await this.getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
  }

  // Autenticação OAuth2 (Client Credentials)
  private async getAccessToken(): Promise<string> {
    // Se tiver token válido (com margem de 60s), retorna ele
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) {
        return this.token;
    }

    try {
        console.log('Authenticating with Nuvende API...');
        
        // Formato padrão OAuth2: application/x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.NUVENDE_CLIENT_ID || '');
        params.append('client_secret', process.env.NUVENDE_CLIENT_SECRET || '');
        params.append('scope', process.env.NUVENDE_SCOPES || '');

        // Ajuste: Remover /v1 do final para o endpoint de token, caso a API siga o padrão de auth na raiz
        const baseUrl = process.env.NUVENDE_API_URL || '';
        const authBase = baseUrl.replace(/\/v1\/?$/, ''); 
        const response = await axios.post(
            `${authBase}/oauth/token`, 
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        this.token = response.data.access_token;
        // Define expiração (default 3600s se não vier)
        const expiresIn = response.data.expires_in || 3600; 
        this.tokenExpiresAt = Date.now() + (expiresIn * 1000);

        console.log('Nuvende Authentication Successful.');
        return this.token!;
    } catch (error: any) {
        console.error('Nuvende Auth Failed:', error.response?.data || error.message);
        console.error('Attempted URL:', this.api.defaults.baseURL + '/oauth/token');
        throw new Error('Failed to authenticate with Nuvende API');
    }
  }

  // Gera uma cobrança Pix (Ramp-on)
  async createPixCharge(userId: string, amount: number) {
    try {
      // Ajuste para usar o endpoint de Cobrança Pix da Nuvende
      const response = await this.api.post('/pix/cob', {
        calendario: {
            expiracao: 3600
        },
        valor: {
            original: amount.toFixed(2)
        },
        chave: process.env.NUVENDE_PIX_KEY, // Chave do Recebedor (Nuvende/Conta Mestra)
        solicitacaoPagador: `Depósito Nuvende User ${userId}`,
        // infoAdicionais: [...]
      });
      return response.data;
    } catch (error: any) {
      console.error('Nuvende API Error (Create Charge):', error.response?.data || error.message);
      throw new Error('Failed to create Pix charge with Nuvende Provider');
    }
  }

  // Solicita um saque via Pix (Ramp-off)
  async sendPixPayment(userId: string, amount: number, pixKey: string, pixKeyType: string = 'CPF') {
    try {
      // Ajuste para endpoint de Pagamento Pix (semelhante ao Dict/Payment)
      const response = await this.api.post('/pix/payments', {
        valor: amount.toFixed(2),
        pagador: {
             chave: process.env.NUVENDE_PIX_KEY // Quem paga é a conta da Nuvende
        },
        favorecido: {
            chave: pixKey
        },
        descricao: `Saque Nuvende User ${userId}`
      });
      return response.data;
    } catch (error: any) {
      console.error('Nuvende API Error (Send Payment):', error.response?.data || error.message);
      throw new Error('Failed to send Pix payment with Nuvende Provider');
    }
  }
}
