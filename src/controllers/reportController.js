import { logger } from "@oisamitech/sami-logger";
import createFilename from "../helpers/createFilename.js";
import ClickupService from "../services/clickupService.js";
import GCPStorageService from "../services/gcpStorageService.js";
import { createSheet } from "../helpers/createSheet.js";

export default class ReportController {
    constructor(fastify) {
        this.fastify = fastify;
        this.clickupService = new ClickupService();
        this.gcpStorageService = new GCPStorageService();
    }

    async saveTickets(request, reply) {
        try {
            const { listId, startDate, endDate } = request.body;

            let tickets = await this.clickupService.getTickets(listId,new Date(startDate + 'T00:00:00Z').getTime(), new Date(endDate + 'T23:59:59Z').getTime());
            let list = await this.clickupService.getList(listId);
    
            let filename = createFilename(list.name, 'json');
            let data = typeof tickets === 'string' 
            ? tickets 
            : JSON.stringify(tickets, null, 2);
            let uploadResult = await this.gcpStorageService.uploadFile(data, filename, 'application/json');
            
            // Calculate statistics
            const totalTickets = tickets.length;
            const ticketsWithTags = tickets.filter(tickets => tickets.tags && tickets.tags.length > 0).length;
            const ticketsWithoutTags = totalTickets - ticketsWithTags;
            
            return reply.code(200).send({
                success: true,
                message: 'File uploaded to GCP Storage successfully!',
                data: {
                    list: {
                        id: listId,
                        name: list?.name || 'Name not available',
                        totalTickets: totalTickets
                    },
                    file: {
                        filename: filename,
                        bucket: process.env.GOOGLE_CLOUD_BUCKET_NAME,
                        gcpPath: `${filename}`,
                        size: `${JSON.stringify(tickets).length} bytes`,
                        uploadResult: uploadResult
                    },
                    statistics: {
                        totalTickets: totalTickets,
                        ticketsWithTags: ticketsWithTags,
                        ticketsWithoutTags: ticketsWithoutTags
                    },
                    processingTime: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error(`Processing error:`, error.message);
            
            return reply.code(500).send({ 
                success: false,
                message: 'Error processing and saving tickets',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async timeMetrication(request, reply) {
        try {
            const { listId, startDate, endDate, path } = request.body;

            let tickets = await this.clickupService.getTickets(listId, new Date(startDate + 'T00:00:00Z').getTime(), new Date(endDate + 'T23:59:59Z').getTime(), true);
            let list = await this.clickupService.getList(listId);
            let spreadsheet = createSheet([{listName: list.name, tickets: tickets }]);

            let filename = `${list.name}_${startDate}_to_${endDate}`;

            await this.gcpStorageService.uploadFile(spreadsheet, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', path);

            return reply.code(200).send({
                file: {
                    name: filename,
                    path: path ? `${path}/${filename}` : filename,
                    size: `${spreadsheet.length} bytes`,
                    bucket: process.env.GOOGLE_CLOUD_BUCKET_NAME
                },
                report: {
                    listName: list?.name || 'List name not available',
                    startDate: startDate,
                    endDate: endDate,
                    totalTickets: tickets.length
                }
            });
        } catch (error) {
            logger.error(`Processing error:`, error.message);
            
            return reply.code(500).send({ 
                success: false,
                message: 'Error processing and saving tasks',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async createReport(request, reply) {
        try {
            const { folderId, startDate, endDate, path, exceptForLists } = request.body;
            let lists = await this.clickupService.getLists(folderId, exceptForLists);
            let tickets = [];

            for (const list of lists) {
                logger.info(`Processando os chamados da lista ${list.name}`);
                let currentTickets = await this.clickupService.getTickets(list.id, new Date(startDate + 'T00:00:00Z').getTime(), new Date(endDate + 'T23:59:59Z').getTime(), true);

                if (currentTickets.length === 0) {
                    continue;
                }

                tickets = [
                    ...tickets, 
                    { 
                        listName: list.name, 
                        tickets: currentTickets 
                    }
                ];
            }

            let spreadsheet = createSheet(tickets);
            let filename = `${folderId}_${startDate}_to_${endDate}`;
            await this.gcpStorageService.uploadFile(spreadsheet, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', path);

            return reply.code(200).send(
                { 
                    success: true,
                    message: 'Report created successfully',
                    file: {
                        name: filename,
                        path: path ? `${path}/${filename}` : filename,
                        size: `${spreadsheet.length} bytes`,
                        bucket: process.env.GOOGLE_CLOUD_BUCKET_NAME
                    },
                    report: {
                        folderId: folderId,
                        startDate: startDate,
                        endDate: endDate
                    }
                }
            );

        } catch (error) {
            logger.error(`Processing error:`, error.message);

            return reply.code(500).send({ 
                success: false,
                message: 'Error creating report',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}