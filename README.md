# Automação de Tickets com ClickUp e IA

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Redis](https://img.shields.io/badge/Redis-7.x-red)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sistema de automação de tickets que utiliza o ClickUp como base e IA para categorização e atribuição inteligente de tarefas.

## 🚀 Funcionalidades

- **Categorização Automática** de tickets usando IA (Google Gemini)
- **Atribuição Inteligente** de responsáveis baseada em histórico
- **Definição Automática** de prioridade, squad e origem
- **Integração** completa com a API do ClickUp
- **Cache** com Redis para melhor desempenho

## 🛠️ Pré-requisitos

- Node.js 18+
- Redis 7+
- Conta no ClickUp
- Chave de API do Google Gemini

## 🔧 Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/clickup-ai-automation.git
   cd clickup-ai-automation/api
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente (crie um arquivo `.env` na raiz do projeto):
   ```env
   # ClickUp
   CLICKUP_API_TOKEN=seu_token_aqui
   CLICKUP_TEAM_ID=seu_team_id
   CLICKUP_LIST_ID=sua_lista_id
   
   # Google Gemini
   GEMINI_API_KEY=sua_chave_aqui
   GEMINI_MODEL=gemini-1.5-pro
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   
   # Aplicação
   PORT=3000
   NODE_ENV=development
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```

## 🚀 Como Usar

### Configuração do Webhook no ClickUp

1. Acesse as configurações do seu espaço no ClickUp
2. Vá em "Apps" > "Integrations"
3. Adicione um novo webhook apontando para: `https://sua-api.com/webhook`
4. Selecione os eventos que deseja monitorar

### Endpoints

- `POST /webhook` - Endpoint para receber webhooks do ClickUp
- `GET /health` - Verifica a saúde da aplicação

## 🏗️ Estrutura do Projeto

```
api/
├── config/           # Configurações da aplicação
├── controllers/      # Lógica dos controladores
├── helpers/         # Funções auxiliares
├── middlewares/     # Middlewares do Express
├── models/          # Modelos de dados
├── routes/          # Definição das rotas
├── service/         # Serviços e lógica de negócio
├── .env.example     # Exemplo de variáveis de ambiente
├── .gitignore       # Arquivos ignorados pelo Git
├── package.json     # Dependências e scripts
└── README.md        # Este arquivo
```

## 🤖 Como a IA é Utilizada

O sistema utiliza o Google Gemini para:
- Classificar a prioridade dos tickets
- Atribuir tags relevantes
- Definir o squad responsável
- Identificar a origem do ticket
- Sugerir responsáveis com base em histórico

## 🔄 Fluxo de Processamento

1. Recebimento do webhook do ClickUp
2. Verificação de duplicação (usando cache)
3. Análise do ticket pela IA
4. Aplicação das categorizações e atribuições
5. Atualização do ticket no ClickUp

## 📊 Monitoramento

A aplicação inclui endpoints de monitoramento:

```bash
# Saúde da aplicação
GET /health

# Métricas do Redis
GET /metrics/redis

# Estatísticas de processamento
GET /metrics/processing
```

## 🧪 Testes

Para executar os testes:

```bash
npm test
```

## 🚀 Deploy

### Docker

```bash
docker-compose up --build
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e enviar pull requests.

1. Faça um Fork do projeto
2. Crie sua Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato via issues ou envie um e-mail para suporte@exemplo.com

---

Desenvolvido com ❤️ por [Seu Nome] - [@seuusuario](https://github.com/seuusuario)
