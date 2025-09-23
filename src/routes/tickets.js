import TicketController from '../controllers/ticketController.js';
import { 
    categorizeTicketSchema, 
    saveTicketsSchema, 
    healthResponseSchema,
    categorizeSuccessSchema,
    saveTicketsSuccessSchema,
    timeMetricationResponseSchema,
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

    // Salvar tickets de uma lista
    fastify.post('/export-tickets', {
        schema: {
            body: saveTicketsSchema.body,
            response: saveTicketsSuccessSchema
        },
        handler: (request, reply) => controller.saveTickets(request, reply)
    });

    fastify.post('/generate-list-report', {
        schema: {
            body: saveTicketsSchema.body,
            response: timeMetricationResponseSchema
        },
        handler: (request, reply) => controller.timeMetrication(request, reply)
    });

    fastify.post('/generate-folder-report', {
        schema: {
            body: createReportSchema.body,
            response: createReportSuccessSchema
        },
        handler: (request, reply) => controller.createReport(request, reply)
    });

    // Healthcheck
    fastify.get('/health', {
        schema: {
            response: healthResponseSchema
        },
        handler: (request, reply) => controller.health(request, reply)
    });
}