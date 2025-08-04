import { createClient } from 'redis';
import 'dotenv/config';

export default class RedisService {
    constructor() {
        this.redisClient = createClient({
            socket: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT)
            },
            password: process.env.REDIS_PASSWORD,
            database: parseInt(process.env.REDIS_DB)
        });
        
        this.isConnected = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.redisClient.on('error', (err) => {
            console.error('❌ Redis Error:', err);
            this.isConnected = false;
        });

        this.redisClient.on('connect', () => {
            console.log('✅ Redis conectado');
            this.isConnected = true;
        });
    }

    async ensureConnection() {
        if (!this.isConnected) {
            try {
                await this.redisClient.connect();
            } catch (error) {
                console.error('❌ Falha na conexão Redis:', error);
                return false;
            }
        }
        return true;
    }

    // ✅ MÉTODO ESSENCIAL 1: Verificar se chave existe
    async has(key) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        } catch (error) {
            console.error('❌ Redis HAS Error:', error);
            return false; // Falha segura - assume que não existe
        }
    }

    // ✅ MÉTODO ESSENCIAL 2: Marcar chave com TTL (compatibilidade com millisegundos)
    async set(key, value, ttlMs) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            const ttlSeconds = Math.ceil(ttlMs / 1000);
            await this.redisClient.setEx(key, ttlSeconds, 'true');
            
            console.log(`📝 Redis: ${key} (TTL: ${ttlSeconds}s)`);
            return true;
        } catch (error) {
            console.error('❌ Redis SET Error:', error);
            return false;
        }
    }

    // 🧹 MÉTODO OPCIONAL: Para testes/debug
    async clear() {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            await this.redisClient.flushDb();
            console.log('🧹 Cache Redis limpo');
            return true;
        } catch (error) {
            console.error('❌ Redis CLEAR Error:', error);
            return false;
        }
    }

    // 🔌 MÉTODO OPCIONAL: Para graceful shutdown
    async disconnect() {
        if (this.redisClient && this.isConnected) {
            await this.redisClient.disconnect();
            this.isConnected = false;
            console.log('🔌 Redis desconectado');
        }
    }
}