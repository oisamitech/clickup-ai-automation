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
            console.error('Redis Error:', err);
            this.isConnected = false;
        });

        this.redisClient.on('connect', () => {
            console.log('Redis connected');
            this.isConnected = true;
        });
    }

    async ensureConnection() {
        if (!this.isConnected) {
            try {
                await this.redisClient.connect();
            } catch (error) {
                console.error('Redis connection failed:', error);
                return false;
            }
        }
        return true;
    }

    //Check if key exists
    async has(key) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        } catch (error) {
            console.error('Redis HAS Error:', error);
            return false; // Safe failure - assume it doesn't exist
        }
    }

    //Set key with TTL (milliseconds compatibility)
    async set(key, value, ttlMs) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            const ttlSeconds = Math.ceil(ttlMs / 1000);
            
            // If value is an object, convert to JSON
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            
            await this.redisClient.setEx(key, ttlSeconds, stringValue);
            
            console.log(`Redis: ${key} (TTL: ${ttlSeconds}s)`);
            return true;
        } catch (error) {
            console.error('Redis SET Error:', error);
            return false;
        }
    }

    //Save files in chunks
    async saveFiles(files) {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return false;
            
            if (files.length === 0) {
                return true;
            }

            await this.redisClient.setEx('files', 86400, JSON.stringify(files));
            console.log(`Successfully cached ${files.length} files`);
            return true;
        } catch (error) {
            console.warn('Failed to cache files:', error.message);
            return false;
        }
    }

    //Get files from cache
    async getFiles() {
        try {
            const connected = await this.ensureConnection();
            if (!connected) return null;
            
            let filesExists = await this.redisClient.get('files');

            if (!filesExists) {
                console.log('No files found in cache');
                return false;
            }

            return JSON.parse(filesExists);
        } catch (error) {
            console.warn('Failed to get files:', error.message);
            return false;
        }
    }
}