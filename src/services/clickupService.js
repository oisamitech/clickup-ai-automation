import axios from "axios";
import Ticket from '../models/Ticket.js';

export default class ClickupService {
    constructor(logger = console) {
        this.logger = logger;
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
                throw new Error('Priority is required for update');
            }
            
            const response = await this.api.put(`/task/${ticketId}`, { priority });
            
            return {
                success: true,
                message: `Ticket priority "${response.data.name}" updated successfully`,
                data: response.data
            };
        } catch (error) {
            this.logger.error('Error updating ticket priority:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async addTagToTicket(ticketId, tagName) {
        try {
            if (!tagName) {
                throw new Error('Tag name is required');
            }
            
            const response = await this.api.post(`/task/${ticketId}/tag/${encodeURIComponent(tagName)}`);
            
            return {
                success: true,
                message: `Tag "${tagName}" added successfully to the ticket.`,
                data: response.data
            };
        } catch (error) {
            this.logger.error(`Error adding tag ${tagName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async setCustomField(ticketId, fieldId, value) {
        try {
            let response = await this.api.post(`/task/${ticketId}/field/${fieldId}`, { value });
            
            return {
                success: true,
                message: `Custom field "${fieldId}" updated successfully on the ticket.`,
                data: response.data
            };
        } catch (error) {
            this.logger.error('Error updating ticket custom field:', error.response?.data || error.message);
            throw error;
        }
    }

    async setAssignees(ticketId, assignees) {
        try {
            let response = await this.api.put(`/task/${ticketId}`, { assignees: {add: assignees} });
            
            return {
                success: true,
                message: `Assignees assigned successfully to the ticket.`,
                data: response.data
            };
        } catch (error) {
            this.logger.error('Error assigning assignees to the ticket:', error.response?.data || error.message);
            throw error;
        }
    }

    async getTickets(id) {
        try {
            let now = Date.now();
            let fourMonthsAgo = now - (4 * 30 * 24 * 60 * 60 * 1000);
            let allTickets = [];
            let page = 0;
            let hasMore = true;

            while (hasMore) {
                const res = await this.api.get(`list/${id}/task`, {
                    params: {
                        archived: false,
                        include_closed: true,
                        date_created_gt: fourMonthsAgo,
                        date_created_lt: now,
                        limit: 100,
                        page: page
                    }
                });

                if (res.data.tasks && res.data.tasks.length > 0) {
                    allTickets = [...allTickets, ...res.data.tasks];
                    page++;
                } else {
                    hasMore = false;
                }
            }

            let tickets = allTickets.map(t => new Ticket(t));
            return tickets;
        } catch (error) {
            this.logger.error('Error fetching tickets:', error.response?.data || error.message);
            throw error;
        }
    }

    async getList(id) {
        try {
            let response = await this.api.get(`list/${id}`);
            return response.data;
        } catch (error) {
            this.logger.error('Error fetching list:', error.response?.data || error.message);
            throw error;
        }
    }

    async getTicket(id) {
        try {
            let response = await this.api.get(`/task/${id}`);
            return new Ticket(response.data);       
        } catch (error) {
            this.logger.error('Error fetching task:', error.response?.data || error.message);
            throw error;
        }
    }
}