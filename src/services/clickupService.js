import axios from "axios";
import { logger } from "@oisamitech/sami-logger";
import ReportTicket from "../models/ReportTicket.js";
import HistoryTicket from "../models/HistoryTicket.js";

export default class ClickupService {
    constructor() {
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
            logger.error('Error updating ticket priority:', error.response?.data || error.message);
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
            logger.error(`Error adding tag ${tagName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async setCustomField(ticketId, fieldId, value, optionName = 'customField') {
        try {
            let response = await this.api.post(`/task/${ticketId}/field/${fieldId}`, { value });
            
            return {
                success: true,
                message: `Custom field "${fieldId}" updated successfully on the ticket.`,
                data: response.data
            };
        } catch (error) {
            logger.error(`Error updating ticket custom field ${optionName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async setAssignees(ticketId, assignees, ) {
        try {
            let response = await this.api.put(`/task/${ticketId}`, { assignees: {add: assignees} });
            
            return {
                success: true,
                message: `Assignees assigned successfully to the ticket.`,
                data: response.data
            };
        } catch (error) {
            logger.error('Error assigning assignees to the ticket:', error.response?.data || error.message);
            throw error;
        }
    }

    async getTickets(listId, startDate, endDate, includeTimeLine = false) {
        try {
            let allTickets = [];
            let page = 0;
            let hasMore = true;

            while (hasMore) {
                const res = await this.api.get(`list/${listId}/task`, {
                    params: {
                        archived: false,
                        include_closed: true,
                        date_done_gt: startDate,
                        date_done_lt: endDate,
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

            if (includeTimeLine) {
                let tickets = await Promise.all(
                    allTickets.map(async (ticket) => {
                        let response = await this.api.get(`task/${ticket.id}/time_in_status`);                        
                        return new ReportTicket(response.data, ticket);
                    })
                );

                return tickets;
            }

            let tickets = allTickets.map(t => new HistoryTicket(t));
            return tickets;
        } catch (error) {
            logger.error('Error fetching tickets:', error.response?.data || error.message);
            throw error;
        }
    }

    async getList(id) {
        try {
            let response = await this.api.get(`list/${id}`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching list:', error.response?.data || error.message);
            throw error;
        }
    }

    async getTicket(id) {
        try {
            let response = await this.api.get(`/task/${id}`);
            return new HistoryTicket(response.data);       
        } catch (error) {
            logger.error('Error fetching ticket:', error.response?.data || error.message);
            throw error;
        }
    }

    async getTicketTimeInStatus(ticket) {
        try {
            let response = await this.api.get(`task/${ticket.id}/time_in_status`);
            return new TicketInTime(ticket.id, response.data.status_history, ticket.assignees);
        } catch (error) {
            logger.error('Error fetching ticket:', error.response?.data || error.message);
            throw error;
        }
    }
}