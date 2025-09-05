import fp from 'fastify-plugin';
import RedisService from '../services/redisService.js';
import { logger } from "@oisamitech/sami-logger";

async function redisPlugin(fastify) {
  const redisService = new RedisService();
  
  try {
    await redisService.ensureConnection();
    fastify.decorate('redis', redisService);
    logger.info('✅ Redis connected and decorated');
  } catch (error) {
    logger.warn('Redis not available, continuing without cache:', error.message);
    fastify.decorate('redis', null);
  }
  
  fastify.addHook('onClose', async () => {
    if (fastify.redis) {
      await fastify.redis.disconnect();
    }
  });
}

export default fp(redisPlugin);