
## Guia de Deploy para Produção

Se você subir essa aplicação em um servidor (Vercel, Railway, Render, etc.), a principal vantagem é que a **Nuvende conseguirá enviar o Webhook real** para o seu backend.

### O que muda no código?

Já deixei o código preparado para funcionar tanto localmente quanto em produção:

1.  **Polling Automático:** O frontend agora fica verificando a cada 3 segundos se o pagamento caiu.
2.  **Webhook Real:** Em produção, a simulação local (popup automático) será desativada e o sistema aguardará o aviso real da Nuvende.

### Passos para subir em produção:

#### 1. Banco de Dados (Supabase/PostgreSQL)
Como você mencionou Supabase, você precisará:
1. Criar um projeto no [Supabase](https://supabase.com).
2. Pegar a string de conexão (Transaction Pooler).
3. Alterar seu `.env` de produção:
   ```env
   DATABASE_URL="postgresql://postgres:[SENHA]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
   ```
4. Atualizar o `prisma/schema.prisma`:
   - Trocar `provider = "sqlite"` por `provider = "postgresql"`.
   - Rodar `npx prisma migrate deploy`.

#### 2. Deploy do Backend (Railway/Render)
O backend precisa ficar rodando 24/7 para receber Webhooks.
- Conecte seu repositório GitHub.
- Defina as variáveis de ambiente (`NUVENDE_CLIENT_ID`, etc.).
- Comando de Start: `npm start`.

#### 3. Deploy do Frontend (Vercel)
- Conecte o repositório.
- Configure a variável `VITE_API_URL` apontando para a URL do seu backend (ex: `https://seu-backend.railway.app`).

### Resumo
Ao subir para um servidor, o fluxo fica **100% real**:
1. Você gera o Pix.
2. Paga no app do banco.
3. Nuvende avisa seu servidor (`POST /webhook`).
4. Seu servidor atualiza o banco.
5. A tela do usuário atualiza sozinha ("Depósito Confirmado!").
