import ReportController from "../controllers/reportController.js";
import { createReportSchema, createReportSuccessSchema, saveTicketsSchema, saveTicketsSuccessSchema, timeMetricationResponseSchema } from "../schemas/ticketSchemas.js";

export default async function reportRoutes(fastify) {
    const controller = new ReportController(fastify);

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
}