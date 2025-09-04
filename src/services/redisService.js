import { createClient } from 'redis';

export default class RedisService {
    constructor(logger = console) {
        this.logger = logger;
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
            this.logger.error('❌ Redis Error:', err);
            this.isConnected = false;
        });

        this.redisClient.on('connect', () => {
            this.logger.info('✅ Redis connected');
            this.isConnected = true;
        });
    }

    async ensureConnection() {
        if (!this.isConnected) {
            try {
                await this.redisClient.connect();
            } catch (error) {
                this.logger.error('Redis connection failed:', error);
                return false;
            }
        }
        return true;
    }

    async disconnect() {
        if (this.isConnected) {
            await this.redisClient.quit();
            this.isConnected = false;
        }
    }

    async has(key) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        } catch (error) {
            this.logger.error('Redis HAS Error:', error);
            return false;
        }
    }

    async set(key, value, ttlMs) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            const ttlSeconds = Math.ceil(ttlMs / 1000);
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            
            await this.redisClient.setEx(key, ttlSeconds, stringValue);
            this.logger.info(`📝 Redis: ${key} (TTL: ${ttlSeconds}s)`);
            return true;
        } catch (error) {
            this.logger.error('Redis SET Error:', error);
            return false;
        }
    }

    async saveFiles(files) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            if (files.length === 0) return true;

            await this.redisClient.setEx('files', 86400, JSON.stringify(files));
            this.logger.info(`✅ Successfully cached ${files.length} files`);
            return true;
        } catch (error) {
            this.logger.warn('Failed to cache files:', error.message);
            return false;
        }
    }

    async getFiles() {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return null;
            
            let filesExists = await this.redisClient.get('files');

            if (!filesExists) {
                this.logger.info('No files found in cache');
                return false;
            }

            return JSON.parse(filesExists);
        } catch (error) {
            this.logger.warn('Failed to get files:', error.message);
            return false;
        }
    }
}