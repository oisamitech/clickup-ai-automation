import createFilename from "../helpers/createFilename.js";
import ClickupService from "../service/clickupService.js";
import GCPStorageService from "../service/gcpStorageService.js";
import GeminiService from "../service/geminiService.js";
import RedisService from "../service/redisService.js";

export default class TicketController {
    constructor() {
        this.clickupService = new ClickupService();
        this.geminiService = new GeminiService();
        this.gcpStorageService = new GCPStorageService();
        this.redisService = new RedisService();

        this.redisService.ensureConnection().catch(error => {
            console.error('⚠️ Redis not available, continuing without cache:', error.message);
        })
    }

    async categorizeTicket(req, res) {
        try {
            const { task_id, history_items = [] } = req.body;
            
            if (!task_id) {
                return res.status(422).json({ success: false, message: 'task_id não fornecido' });
            }
            
            let isFromOurAPI = history_items.some(item => 
                item.user && item.user.id === parseInt(process.env.CLICKUP_USER_ID)
            );
            
            if (isFromOurAPI) {
                return res.status(200).json({ success: true, message: 'Evento da própria API ignorado' });
            }
            
            if (!history_items.some(item => item.user)) {
                return res.status(422).json({ success: false, message: 'evento não gerado por um usuário' });
            }
            
            let cacheKey = `ticket_${task_id}`;
            if (await this.redisService.has(cacheKey)) {
                return res.status(200).json({ success: true, message: 'ticket já processado recentemente' });
            }
            
            res.status(202).json({ success: true, message: 'Processando...' });
            
            await this.redisService.set(cacheKey, true, 300000);
            
            const ticket = await this.clickupService.getTicket(task_id);
            
            const isAlreadyProcessed = ticket.priority || (ticket.tags && ticket.tags.length > 0) || ticket.squad || ticket.origin;
            
            if (isAlreadyProcessed) {
                console.log('ℹ️ Ticket already categorized:', task_id);
                return; // Already sent 202, no need to respond again
            }
            
            const files = await this.gcpStorageService.getAllFiles();
            const categorization = await this.geminiService.categorizeTicket(ticket, files);
            
            if (!categorization) {
                console.warn('⚠️ Could not categorize ticket:', task_id);
                return;
            }
            
            if (categorization.priority) {
                await this.clickupService.setPriority(task_id, { 
                    priority: categorization.priority 
                });
                console.log('✅ Priority updated:', {
                    task_id,
                    priority: categorization.priority
                });
            }
            
            if (categorization.tags?.[0]?.name) {
                await this.clickupService.addTagToTicket(
                    task_id, 
                    categorization.tags[0].name
                );
                console.log('✅ Tag added:', {
                    task_id,
                    tag: categorization.tags[0].name
                });
            }

            if (categorization.squad) {
                await this.clickupService.setCustomField(
                    task_id,
                    categorization.squad.field_id,
                    categorization.squad.value
                );
                console.log('✅ Squad updated:', {
                    task_id,
                    squad: categorization.squad.option.name
                });
            }

            if (categorization.origin) {
                await this.clickupService.setCustomField(
                    task_id,
                    categorization.origin.field_id,
                    categorization.origin.value
                );
                console.log('✅ Origin updated:', {
                    task_id,
                    origin: categorization.origin.option.name
                });
            }

            if (categorization.assignees) {

                let assigneesIds = categorization.assignees.map((assignee) => assignee.id);

                await this.clickupService.setAssignees(
                    task_id,
                    assigneesIds
                );
                console.log('✅ Assignees assigned:', {
                    task_id,
                    assignees: assigneesIds
                });
            }
            
        } catch (error) {
            console.error('❌ Error processing webhook:', {
                error: error.message,
                task_id: req.body.task_id,
                timestamp: new Date().toISOString()
            });
            
            // ✅ Only respond if headers haven't been sent yet
            if (!res.headersSent) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao processar o webhook', 
                    error: error.message 
                });
            }
        }
    }

    async saveTickets(req, res) {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(422).json({ 
                    success: false,
                    message: "ID da lista é obrigatório",
                    error: "Campo 'id' não fornecido"
                });
            }

            let tasks = await this.clickupService.getTickets(id);
            let list = await this.clickupService.getList(id);
    
            let filename = createFilename(list.name, 'json');
            let uploadResult = await this.gcpStorageService.uploadFile(tasks, filename);
            
            // Calculate statistics
            const totalTasks = tasks.length;
            const tasksWithTags = tasks.filter(task => task.tags && task.tags.length > 0).length;
            const tasksWithoutTags = totalTasks - tasksWithTags;
            
            return res.status(200).json({
                success: true,
                message: 'Arquivo enviado para GCP Storage com sucesso!',
                data: {
                    list: {
                        id: id,
                        name: list?.name || 'Nome não disponível',
                        totalTasks: totalTasks
                    },
                    file: {
                        filename: filename,
                        bucket: process.env.GOOGLE_CLOUD_BUCKET_NAME,
                        gcpPath: `${filename}`,
                        size: `${JSON.stringify(tasks).length} bytes`,
                        uploadResult: uploadResult
                    },
                    statistics: {
                        totalTasks: totalTasks,
                        tasksWithTags: tasksWithTags,
                        tasksWithoutTags: tasksWithoutTags
                    },
                    processingTime: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error(`❌ Processing error:`, error.message);
            
            return res.status(500).json({ 
                success: false,
                message: 'Erro ao processar e salvar tasks',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}