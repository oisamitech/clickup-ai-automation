# Use a imagem oficial do Node.js LTS
FROM node:18-alpine AS builder

ARG NPM_TOKEN=$NPM_TOKEN

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia apenas os arquivos necessários para instalação de dependências
COPY .npmrc ./
COPY package*.json ./

# Instala as dependências de produção
RUN npm ci --only=production

# Estágio final de produção
FROM node:18-alpine

# Instala pino-pretty para logs mais legíveis
RUN npm install -g pino-pretty

# Define o usuário não-root para maior segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Cria o diretório para arquivos e define as permissões corretas
RUN mkdir -p /usr/src/app && \
    chown -R appuser:appgroup /usr/src/app

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia as dependências do estágio de construção
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copia o código da aplicação
COPY . .

# Define o usuário não-root
USER appuser

# Expõe a porta que o webhook irá escutar
EXPOSE 3000

# Comando para iniciar o webhook
CMD ["node", "src/server.js"]