import cors from '@fastify/cors';

export default async function corsPlugin(fastify) {
    await fastify.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
}