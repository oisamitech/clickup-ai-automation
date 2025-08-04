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
            console.error('⚠️ Redis não disponível, continuando sem cache:', error.message);
        })
    }

    async categorizeTicket(req, res) {
        res.status(202).json({ success: true, message: 'Processando...' });
        
        try {
            const { task_id, event, webhook_id, history_items = [] } = req.body;
            
            // Validação básica
            if (!task_id) {
                console.warn('❌ Webhook inválido: task_id não fornecido');
                return;
            }
            
            // 1. Verifica se o evento veio de um usuário real ou do sistema
            const isFromUser = history_items.some(item => item.user);
            if (!isFromUser) {
                console.log('ℹ️  Ignorando evento gerado pelo sistema:', event);
                return;
            }
            
            // 2. Verifica se o ticket já foi processado recentemente (cache simples)
            let cacheKey = `ticket_${task_id}`;
            if (await this.redisService.has(cacheKey)) {
                console.log('ℹ️  Ticket já processado recentemente:', task_id);
                return;
            }
            
            // Adiciona ao cache com TTL de 5 minutos
            await this.redisService.set(cacheKey, true, 300000); // 5 minutos em ms
            
            // 3. Obtém o ticket apenas se necessário
            const ticket = await this.clickupService.getTicket(task_id);
            
            // 4. Verifica se o ticket já tem prioridade/tag definida
            if (ticket.priority || (ticket.tags && ticket.tags.length > 0)) {
                console.log('ℹ️  Ticket já categorizado:', task_id);
                return;
            }
            
            // 5. Processa a categorização
            const files = await this.gcpStorageService.getAllFiles();
            const categorization = await this.geminiService.categorizeTicket(ticket, files);
            
            if (!categorization) {
                console.warn('⚠️  Não foi possível categorizar o ticket:', task_id);
                return;
            }
            
            // 6. Atualiza a prioridade do ticket
            if (categorization.priority) {
                await this.clickupService.setPriority(task_id, { 
                    priority: categorization.priority 
                });
                console.log('✅ Prioridade atualizada:', {
                    task_id,
                    priority: categorization.priority
                });
            }
            
            // 7. Adiciona a tag ao ticket, se existir
            if (categorization.tags?.[0]?.name) {
                await this.clickupService.addTagToTicket(
                    task_id, 
                    categorization.tags[0].name
                );
                console.log('✅ Tag adicionada:', {
                    task_id,
                    tag: categorization.tags[0].name
                });
            }

            //8. Define a Squad do ticket
            if (categorization.squad) {
                await this.clickupService.setCustomField(
                    task_id,
                    categorization.squad.field_id,
                    categorization.squad.value
                );
                console.log('✅ Squad atualizada:', {
                    task_id,
                    squad: categorization.squad.option.name
                });
            }

            //9. Define a Origem do ticket
            if (categorization.origin) {
                await this.clickupService.setCustomField(
                    task_id,
                    categorization.origin.field_id,
                    categorization.origin.value
                );
                console.log('✅ Origem atualizada:', {
                    task_id,
                    origin: categorization.origin.option.name
                });
            }

            //10. Define os responsaveis pelo ticket
            if (categorization.assignees) {

                let assigneesIds = categorization.assignees.map((assignee) => assignee.id);

                await this.clickupService.setAssignees(
                    task_id,
                    assigneesIds
                );
                console.log('✅ Responsáveis atribuidos:', {
                    task_id,
                    assignees: assigneesIds
                });
            }
            
        } catch (error) {
            console.error('❌ Erro no processamento do webhook:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
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
            let x = await this.gcpStorageService.uploadFile(tasks, filename);
            
            // Calcular estatísticas
            const totalTasks = tasks.length;
            const tasksWithTags = tasks.filter(task => task.tags && task.tags.length > 0).length;
            const tasksWithoutTags = totalTasks - tasksWithTags;
            

            const response = {
                success: true,
                message: 'Arquivo criado com sucesso!',
                data: {
                    list: {
                        id: id,
                        name: list?.name || 'Nome não disponível',
                        totalTasks: totalTasks
                    },
                    file: {
                        filename: filename,
                        path: `files/${filename}`,
                        size: `${JSON.stringify(tasks).length} bytes`
                    },
                    statistics: {
                        totalTasks: totalTasks,
                        tasksWithTags: tasksWithTags,
                        tasksWithoutTags: tasksWithoutTags
                    },
                    processingTime: new Date().toISOString(), 
                    x: x
                }
            };
            
            return res.status(200).json(response);

        } catch (error) {
            console.error(`❌ Erro no processamento:`, error.message);
            
            return res.status(500).json({ 
                success: false,
                message: 'Erro ao processar e salvar tasks',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}