import TicketController from '../controllers/ticketController.js';
import { 
    categorizeTicketSchema, 
    saveTicketsSchema, 
    healthResponseSchema,
    categorizeSuccessSchema,
    saveTicketsSuccessSchema
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

    // Salvar tickets de uma lista
    fastify.post('/save-tickets', {
        schema: {
            body: saveTicketsSchema.body,
            response: saveTicketsSuccessSchema
        },
        handler: (request, reply) => controller.saveTickets(request, reply)
    });

    // Healthcheck
    fastify.get('/health', {
        schema: {
            response: healthResponseSchema
        },
        handler: (request, reply) => controller.health(request, reply)
    });
}