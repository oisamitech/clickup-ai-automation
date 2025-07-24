# Use a imagem oficial do Node.js LTS (suporte de longo prazo)
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia apenas os arquivos necessários para instalação de dependências
COPY package*.json ./

# Instala as dependências de produção
RUN npm ci --only=production

# Estágio final de produção
FROM node:18-alpine

# Define o usuário não-root para maior segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

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
CMD ["node", "index.js"]
