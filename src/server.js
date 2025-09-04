import Fastify from 'fastify';
import { envOptions } from './config/environment.js';

// Plugins
import corsPlugin from './plugins/cors.js';
import redisPlugin from './plugins/redis.js';

// Routes
import ticketRoutes from './routes/tickets.js';

async function build() {
    const fastify = Fastify({
        logger: {
            level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname'
                }
            } : undefined
        }
    });

    try {
        // Registrar validação de environment
        await fastify.register(import('@fastify/env'), envOptions);
        
        // Registrar plugins
        await fastify.register(corsPlugin);
        await fastify.register(redisPlugin);
        
        // Registrar rotas
        await fastify.register(ticketRoutes, { prefix: '/tickets' });
        
        // Hook de erro global
        fastify.setErrorHandler(async (error, request, reply) => {
            fastify.log.error('Global error handler:', error);
            
            return reply.code(500).send({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        });

        // Hook de shutdown graceful
        fastify.addHook('onClose', async () => {
            fastify.log.info('🔄 Server shutting down gracefully');
        });

        return fastify;
        
    } catch (error) {
        fastify.log.error('Error building app:', error);
        process.exit(1);
    }
}

async function start() {
    let server;
    
    try {
        server = await build();
        
        await server.listen({ 
            port: server.config.PORT, 
            host: '0.0.0.0' 
        });
        
        server.log.info(`🚀 ClickUp Webhook running on port ${server.config.PORT}`);
        
    } catch (error) {
        if (server) {
            server.log.error('Server start error:', error);
        } else {
            console.error('Failed to build server:', error);
        }
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Received SIGINT, shutting down gracefully');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

start();