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
            const chunkSize = 1000;
            const chunks = [];

            // Split into chunks
            for (let i = 0; i < files.length; i += chunkSize) {
                chunks.push(files.slice(i, i + chunkSize));
            }

            console.log(`Splitting ${files.length} files into ${chunks.length} chunks`);

            // Save chunks
            for (let i = 0; i < chunks.length; i++) {
                await this.redisClient.setEx(
                    `files_chunk_${i}`, 
                    86400, // 24 hours in seconds
                    JSON.stringify(chunks[i])
                );
            }
            
            // Save metadata
            const metadata = {
                total: files.length,
                chunks: chunks.length,
                cachedAt: new Date().toISOString()
            };

            await this.redisClient.setEx(
                'files_metadata', 
                86400, // 24 hours in seconds
                JSON.stringify(metadata)
            );

            console.log(`Successfully cached ${files.length} files in ${chunks.length} chunks`);
            return true;
        } catch (error) {
            console.warn('Failed to cache files:', error.message);
            return false;
        }
    }

    //Get files from cache
    async getFiles() {
        try {
            // Get metadata
            const metadataString = await this.redisClient.get('files_metadata');
            if (!metadataString) {
                console.log('No cache metadata found');
                return null;
            }

            const metadata = JSON.parse(metadataString);
            console.log(`Found cache: ${metadata.total} files in ${metadata.chunks} chunks`);

            // Get chunks
            const chunks = [];
            for (let i = 0; i < metadata.chunks; i++) {
                const chunkString = await this.redisClient.get(`files_chunk_${i}`);
                if (chunkString) {
                    try {
                        const chunk = JSON.parse(chunkString);
                        chunks.push(chunk);
                    } catch (parseError) {
                        console.warn(`Failed to parse chunk ${i}:`, parseError.message);
                    }
                }
            }

            if (chunks.length === metadata.chunks) {
                // Rebuild complete array
                const files = chunks.flat();
                console.log(`Successfully loaded ${files.length} files from cache`);
                return files;
            } else {
                console.warn(`Missing chunks: ${chunks.length}/${metadata.chunks}`);
                return null;
            }
        } catch (error) {
            console.warn('Failed to get files:', error.message);
            return null;
        }
    }
}