# Webhook de Automação ClickUp com Docker

[![Docker](https://img.shields.io/badge/Docker-18.x-blue)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Webhook containerizado para processamento automático de tarefas no ClickUp, com integração ao Google Gemini para categorização inteligente.

## 🚀 Funcionalidades

- Processamento de webhooks do ClickUp em container Docker
- Categorização automática de tarefas usando IA (Google Gemini)
- Atribuição de prioridade, squad e responsáveis
- Configuração simplificada via variáveis de ambiente
- Healthcheck integrado para monitoramento

## 🐳 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Conta no ClickUp
- Chave de API do Google Gemini

## 🚀 Iniciando com Docker

### 1. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas credenciais
nano .env
```

### 2. Construa e execute os containers

```bash
docker-compose up --build -d
```

### 3. Verifique os logs

```bash
docker-compose logs -f
```

## 🔍 Verificando a Aplicação

A aplicação estará disponível em:
```
http://localhost:3000
```

## 🛠️ Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `docker-compose up -d` | Inicia em segundo plano |
| `docker-compose down` | Para e remove os containers |
| `docker-compose restart` | Reinicia o serviço |
| `docker-compose logs -f` | Mostra os logs em tempo real |
| `docker-compose exec webhook sh` | Acessa o terminal do container |

## 📋 Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example` com as seguintes configurações:

```env
# Configurações do ClickUp
CLICKUP_API_TOKEN=seu_token_aqui
CLICKUP_TEAM_ID=seu_team_id
CLICKUP_API_SECRET=seu_secret
CLICKUP_USER_ID=seu_user_id

# Configurações do Google Gemini
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-1.5-flash

# Configurações da Aplicação
NODE_ENV=production
PORT=3000
```

## 🤖 Como a IA é Utilizada

O container executa automaticamente:
1. Análise de descrições de tickets
2. Categorização automática
3. Definição de prioridades
4. Atribuição de responsáveis

### Fluxo de Processamento:
1. Recebimento do webhook do ClickUp
2. Processamento em container isolado
3. Análise do ticket pela IA
4. Atualização automática no ClickUp