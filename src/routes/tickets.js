import TicketController from '../controllers/ticketController.js';
import { 
    categorizeTicketSchema, 
    healthResponseSchema,
    categorizeSuccessSchema,
    createReportSchema,
    createReportSuccessSchema
} from '../schemas/ticketSchemas.js';

export default async function ticketRoutes(fastify) {
    const controller = new TicketController(fastify);

    // Webhook de categorização automática
    fastify.post('/categorize', {
        schema: {
            body: categorizeTicketSchema.body,
            response: categorizeSuccessSchema
        },
        handler: (request, reply) => controller.categorizeTicket(request, reply)
    });

    // Healthcheck
    fastify.get('/health', {
        schema: {
            response: healthResponseSchema
        },
        handler: (request, reply) => controller.health(request, reply)
    });
}