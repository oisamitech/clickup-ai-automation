import axios from "axios";
import 'dotenv/config';

export default class ClickupService {
    constructor () {
        this.api = axios.create({
            baseURL: process.env.CLICKUP_API_URL,
            headers: {
                Authorization: process.env.CLICKUP_API_TOKEN,
                'Content-Type': 'application/json',
            }
        });
    }

    async setPriority(ticketId, { priority }) {
        try {
            if (priority === undefined) {
                throw new Error('A prioridade é obrigatória para atualização');
            }
            
            const response = await this.api.put(`/task/${ticketId}`, { priority });
            
            return {
                success: true,
                message: `Prioridade do chamado "${response.data.name}" atualizada com sucesso`,
                data: response.data
            };
        } catch (error) {
            console.error('Erro ao atualizar prioridade do chamado:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async addTagToTicket(ticketId, tagName) {
        try {
            if (!tagName) {
                throw new Error('O nome da tag é obrigatório');
            }
            
            const response = await this.api.post(`/task/${ticketId}/tag/${encodeURIComponent(tagName)}`);
            
            return {
                success: true,
                message: `Tag "${tagName}" adicionada com sucesso ao chamado.`,
                data: response.data
            };
        } catch (error) {
            console.error(`Erro ao adicionar a tag ${tagName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async setCustomField(ticketId, fieldId, value) {
        try {
            let response = await this.api.post(`/task/${ticketId}/field/${fieldId}`, { value });
            
            return {
                success: true,
                message: `Custom field "${fieldId}" atualizado com sucesso ao chamado.`,
                data: response.data
            };
        } catch (error) {
            console.error('Erro ao atualizar custom field do chamado:', error.response?.data || error.message);
            throw error;
        }
    }

    async setAssignees(ticketId, assignees) {
        try {
            let response = await this.api.put(`/task/${ticketId}`, { assignees: {add: assignees} });
            
            return {
                success: true,
                message: `Responsáveis atribuidos com sucesso ao chamado.`,
                data: response.data
            };
        } catch (error) {
            console.error('Erro ao atribuir responsáveis ao chamado:', error.response?.data || error.message);
            throw error;
        }
    }

    async getTickets(id) {
        try {
            let now = Date.now();
            let oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

            let res = await this.api.get(`list/${id}/task`, {
                params: {
                    archived: false,
                    include_closed: true,
                    date_closed_gt: oneYearAgo,
                    date_closed_lt: now,
                    limit: 1000
                }
            });

            let tickets = res.data.tasks.map(t => {
                let { id, name, description, tags, status, custom_fields = [], assignees = [] } = t;
                let squadField = Array.isArray(custom_fields) 
                    ? custom_fields.find(cf => cf.name === "SQUAD")
                    : null;
                
                let squadOption = squadField?.type_config?.options?.[squadField.value];

                let originField = Array.isArray(custom_fields) 
                    ? custom_fields.find(cf => cf.name === "🔧 Origem")
                    : null;
                
                let originOption = originField?.type_config?.options?.[originField.value];

                let assigneesField = assignees.map(a => {
                    return {
                        id: a.id,
                        username: a.username
                    }
                });
                    
                return {
                    id,
                    name,
                    status: status?.status || status,
                    description,
                    tags: tags || [],
                    squad: squadOption ? {
                        field_id: squadField.id,
                        value: squadField.value,
                        option: {
                            id: squadOption.id,
                            name: squadOption.name,
                            color: squadOption.color,
                            orderindex: squadOption.orderindex
                        }
                    } : null,
                    origin: originOption ? {
                        field_id: originField.id,
                        value: originField.value,
                        option: {
                            id: originOption.id,
                            name: originOption.name,
                            color: originOption.color,
                            orderindex: originOption.orderindex
                        }
                    } : null,
                    assignees: assigneesField
                };
            });

            return tickets;
        } catch (error) {
            console.error('Erro ao buscar tickets:', error.response?.data || error.message);
            throw error;
        }
    }

    async getList(id) {
        try {
            let response = await this.api.get(`list/${id}`);
            let list = response.data;

            return list;
        } catch (error) {
            console.error('Erro ao buscar lista:', error.response?.data || error.message);
        }
    }

    async getTicket(id) {
        try {
            let response = await this.api.get(`/task/${id}`);
            let task = response.data;

            return {
                id: task.id,
                name: task.name,
                description: task.description,
                status: task.status?.status || task.status,
                priority: task.priority,
                tags: task.tags?.map(tag => tag.name) || [],
                creator: task.creator?.username || 'N/A',
                assignees: task.assignees?.map(assignee => assignee.username) || [],
                created: task.date_created,
                updated: task.date_updated,
                due_date: task.due_date,
                list: task.list?.name || 'N/A',
                space: task.space?.name || 'N/A'
            }            
        } catch (error) {
            console.error('Erro ao buscar task:', error.response?.data || error.message);
            throw error;
        }
    }
}