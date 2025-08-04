# Webhook de Automação ClickUp

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-20.x-blue)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Propósito do Projeto

**Este projeto foi criado para automatizar o processamento de tickets no ClickUp através de webhooks, utilizando inteligência artificial (Google Gemini) para categorização automática de tarefas. O objetivo é reduzir o trabalho manual de categorização e melhorar a eficiência do squad de sustentação.**

## Funcionalidades

- **Webhook ClickUp** - Processamento automático de eventos de tickets
- **IA Google Gemini** - Categorização inteligente de tickets baseada em histórico
- **Cache Redis** - Prevenção de processamento duplicado
- **GCP Storage** - Armazenamento de histórico de tickets para análise
- **Express.js** - Framework web para processamento de webhooks
- **Docker** - Containerização para fácil implantação
- **Healthcheck** - Monitoramento automático da aplicação
- **Logs estruturados** - Rastreamento detalhado de operações

## Estrutura do Projeto

```
api/
├── controllers/          # Manipuladores de requisições
│   └── ticketController.js
├── helpers/             # Funções auxiliares
│   ├── cleanGeminiResponse.js
│   ├── createFilename.js
│   └── parseGeminiResponse.js
├── models/              # Modelos de dados
│   └── Ticket.js
├── routes/              # Rotas da API
│   └── ticketRoutes.js
├── service/             # Serviços de integração
│   ├── clickupService.js
│   ├── geminiService.js
│   ├── gcpStorageService.js
│   └── redisService.js
├── .env                 # Variáveis de ambiente
├── .env.example         # Exemplo de variáveis de ambiente
├── docker-compose.yml   # Configuração do Docker Compose
├── Dockerfile           # Configuração do Docker
├── index.js             # Ponto de entrada da aplicação
└── package.json         # Dependências do projeto
```

## Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker e Docker Compose (para desenvolvimento em containers)
- Conta no ClickUp com API Token
- Chave de API do Google Gemini
- Projeto no Google Cloud Platform com Storage habilitado
- Instância Redis (produção ou local)

### Configuração de Desenvolvimento Local

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd api
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais:

```env
# ClickUp API Configuration
CLICKUP_API_URL=https://api.clickup.com/api/v2
CLICKUP_API_TOKEN=seu_token_aqui
CLICKUP_USER_ID=seu_user_id

# Google Gemini AI Configuration
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-1.5-flash

# Application Configuration
NODE_ENV=development

# GCP Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=seu_projeto_id
GOOGLE_CLOUD_BUCKET_NAME=seu_bucket_name
GOOGLE_SERVICE_ACCOUNT_KEY={"type": "service_account", ...}

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua_senha_redis
REDIS_DB=0
REDIS_TTL_SECONDS=300
```

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

### Configuração com Docker

Para executar a aplicação com Docker:

```bash
docker-compose up -d
```

Isso iniciará o webhook em um container isolado.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento com recarga automática
- `npm start` - Inicia o servidor de produção
- `npm test` - Executa os testes (configuração pendente)

## Funcionalidades da API

### Endpoints Disponíveis

#### POST `/tickets/categorize`
**Webhook principal para categorização automática de tickets**

Processa automaticamente novos tickets do ClickUp:
- Recebe webhook do ClickUp quando um ticket é criado/modificado
- Verifica se o evento veio de um usuário real (não do sistema)
- Previne processamento duplicado através de cache Redis
- Analisa o ticket usando IA Google Gemini
- Atualiza automaticamente prioridade, tags, squad, origem e responsáveis

**Payload esperado (webhook ClickUp):**
```json
{
  "task_id": "string",
  "event": "taskCreated",
  "webhook_id": "string",
  "history_items": []
}
```

#### POST `/tickets/save-tickets`
**Exporta tickets de uma lista para GCP Storage**

Salva todos os tickets de uma lista específica:
- Busca tickets dos últimos 4 meses
- Gera arquivo JSON com timestamp
- Upload para Google Cloud Storage
- Retorna estatísticas de processamento

**Payload esperado:**
```json
{
  "id": "lista_id_do_clickup"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Arquivo criado com sucesso!",
  "data": {
    "list": {
      "id": "lista_id",
      "name": "Nome da Lista",
      "totalTasks": 150
    },
    "file": {
      "filename": "2024-01-15T10:30:00.000Z_Lista_Exemplo.json",
      "path": "files/2024-01-15T10:30:00.000Z_Lista_Exemplo.json",
      "size": "45000 bytes"
    },
    "statistics": {
      "totalTasks": 150,
      "tasksWithTags": 120,
      "tasksWithoutTags": 30
    }
  }
}
```

## Como a IA Funciona

### Processo de Categorização

1. **Recebimento do Webhook**: Sistema recebe notificação do ClickUp
2. **Validação**: Verifica se o evento é válido e não duplicado
3. **Análise do Ticket**: Extrai informações do ticket (título, descrição, etc.)
4. **Consulta ao Histórico**: Busca tickets similares no GCP Storage
5. **Categorização IA**: Google Gemini analisa e categoriza baseado no histórico
6. **Atualização Automática**: Aplica prioridade, tags, squad, origem e responsáveis

### Critérios de Categorização

- **Prioridade**: Baseada na urgência e impacto do problema
- **Tags**: Categorização por tipo de problema (bug, feature, suporte, etc.)
- **Squad**: Atribuição ao time responsável pela área
- **Origem**: Identificação da origem do problema (API, frontend, etc.)
- **Responsáveis**: Atribuição automática baseada no histórico

### Exemplo de Categorização

**Ticket de entrada:**
```
Título: "Erro ao fazer login no sistema"
Descrição: "Usuário não consegue acessar a plataforma"
```

**Categorização automática:**
- Prioridade: 2 (Alta)
- Tag: "bug"
- Squad: "Sinistro"
- Origem: "health-declaration-api"
- Responsáveis: ["Aline Farias de Sobral"]

## Configuração de Webhook no ClickUp

1. Acesse as configurações do espaço no ClickUp
2. Vá em "Integrations" > "Webhooks"
3. Crie um novo webhook com:
   - **URL**: `https://seu-dominio.com/tickets/categorize`
   - **Events**: `taskCreated`, `taskUpdated`
   - **Lists**: Selecione as listas que devem ser monitoradas

## Monitoramento e Logs

### Healthcheck

A aplicação inclui healthcheck configurado no Docker Compose:

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 5s
```

### Logs Estruturados

O sistema gera logs detalhados para monitoramento:

- ✅ **Sucesso**: Operações completadas com sucesso
- ❌ **Erro**: Falhas e exceções
- ⚠️ **Aviso**: Situações que requerem atenção
- ℹ️ **Info**: Informações gerais de processamento

### Exemplo de Logs

```
✅ Redis conectado
📝 Redis: ticket_abc123 (TTL: 300s)
✅ Prioridade atualizada: { task_id: "abc123", priority: 2 }
✅ Tag adicionada: { task_id: "abc123", tag: "bug" }
✅ Squad atualizada: { task_id: "abc123", squad: "Sinistro" }
```

## Variáveis de Ambiente

### Configurações Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `CLICKUP_API_TOKEN` | Token de API do ClickUp | `pk_123456_abcdef` |
| `CLICKUP_USER_ID` | ID do usuário no ClickUp | `123456` |
| `GEMINI_API_KEY` | Chave de API do Google Gemini | `AIzaSy...` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Credenciais do GCP | `{"type": "service_account", ...}` |
| `GOOGLE_CLOUD_BUCKET_NAME` | Nome do bucket no GCP | `clickup-ai-automation` |

### Configurações Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente da aplicação | `production` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `REDIS_PASSWORD` | Senha do Redis | - |
| `REDIS_DB` | Database do Redis | `0` |
| `REDIS_TTL_SECONDS` | TTL do cache em segundos | `300` |

## Arquitetura do Sistema

### Componentes Principais

1. **TicketController**: Orquestra o processamento de webhooks
2. **ClickupService**: Integração com API do ClickUp
3. **GeminiService**: Processamento de IA para categorização
4. **GCPStorageService**: Armazenamento de histórico
5. **RedisService**: Cache para prevenção de duplicatas

### Fluxo de Dados

```
ClickUp Webhook → Express Router → TicketController → 
ClickupService (busca ticket) → GeminiService (categorização) → 
GCPStorageService (histórico) → ClickupService (atualização) → 
RedisService (cache)
```

## Troubleshooting

### Problemas Comuns

#### Erro de Conexão Redis
```
❌ Redis Error: Error: connect ECONNREFUSED ::1:6379
```
**Solução**: Verifique se o Redis está rodando e acessível

#### Erro de Autenticação ClickUp
```
❌ Erro ao buscar task: 401 Unauthorized
```
**Solução**: Verifique se o `CLICKUP_API_TOKEN` está correto

#### Erro de Categorização IA
```
⚠️ Não foi possível categorizar o ticket
```
**Solução**: Verifique se o `GEMINI_API_KEY` está válido

### Comandos de Debug

```bash
# Ver logs em tempo real
docker-compose logs -f

# Acessar container
docker-compose exec webhook sh

# Verificar saúde da aplicação
curl http://localhost:3000/health

# Testar conexão Redis
docker-compose exec webhook redis-cli ping
```

## Contribuição

### Workflow de Desenvolvimento

1. **Criar branch**: `git checkout -b feature/nova-funcionalidade`
2. **Desenvolver**: Implementar funcionalidade seguindo padrões do projeto
3. **Testar**: Executar testes e verificar logs
4. **Commit**: Usar mensagem descritiva
5. **Push**: Enviar para repositório remoto
6. **Pull Request**: Criar PR com descrição detalhada

### Padrões de Código

- **ES6 Modules**: Usar `import/export`
- **Async/Await**: Para operações assíncronas
- **Error Handling**: Try/catch em todas as operações
- **Logging**: Logs estruturados com emojis para fácil identificação
- **Naming**: Nomes descritivos em inglês

## Licença

MIT