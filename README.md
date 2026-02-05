# Nuvende MVP

## Estrutura do Projeto

Este projeto é um monorepo contendo:
- **Backend**: Node.js + Express + Prisma (Raiz)
- **Frontend**: React + Vite (Pasta `/frontend`)

## Como Rodar Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```

2. **Configurar Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz com:
   ```env
   PORT=3001
   DATABASE_URL="file:./dev.db"
   # Adicione as credenciais da Nuvende aqui
   ```

3. **Iniciar o Projeto**:
   - Backend: `npm run dev` (roda na porta 3001)
   - Frontend: `cd frontend && npm run dev` (roda na porta 5173)

## Guia de Deploy

### 1. Banco de Dados (Importante!)
O projeto está configurado com SQLite para desenvolvimento local. **SQLite não funciona bem em deploys serverless (Vercel, etc)** pois os dados são perdidos a cada reinicialização.
Para produção, altere o `prisma/schema.prisma` para usar PostgreSQL e use um serviço como **Neon**, **Supabase** ou **Railway**.

### 2. Frontend (Vercel)
1. Suba este repositório no GitHub.
2. Na Vercel, importe o projeto.
3. Configure o **Root Directory** para `frontend`.
4. Adicione as variáveis de ambiente necessárias (ex: URL do Backend).

### 3. Backend (Render / Railway)
Recomendamos usar **Render** ou **Railway** para o backend, pois eles suportam servidores Node.js contínuos.
1. Conecte seu repositório GitHub.
2. Comando de Build: `npm install && npx prisma generate && npm run build`
3. Comando de Start: `npm start`
4. Adicione as variáveis de ambiente (`DATABASE_URL`, credenciais Nuvende).
