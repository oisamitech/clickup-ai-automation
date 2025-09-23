import axios from "axios";
import { logger } from "@oisamitech/sami-logger";
import ReportTicket from "../models/ReportTicket.js";
import HistoryTicket from "../models/HistoryTicket.js";
import List from "../models/List.js";

export default class ClickupService {
    constructor() {
        this.api = axios.create({
            baseURL: process.env.CLICKUP_API_URL,
            headers: {
                Authorization: process.env.CLICKUP_API_TOKEN,
                'Content-Type': 'application/json',
            }
        });
        
        // Rate limiting configuration
        this.rateLimitConfig = {
            maxRetries: 3,
            baseDelay: 1000, // 1 second
            maxDelay: 30000, // 30 seconds
            requestsPerMinute: 100, // Default for Free/Business plan
            minDelayBetweenRequests: 50 // 100ms between requests
        };
        
        this.lastRequestTime = 0;
    }

    // Helper method to handle rate limiting with retry logic
    async makeRequestWithRetry(requestFn, retryCount = 0) {
        try {
            // Ensure minimum delay between requests
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.rateLimitConfig.minDelayBetweenRequests) {
                await this.delay(this.rateLimitConfig.minDelayBetweenRequests - timeSinceLastRequest);
            }
            this.lastRequestTime = Date.now();

            const response = await requestFn();
            
            // Monitor rate limit headers
            if (response.headers) {
                const remaining = response.headers['x-ratelimit-remaining'];
                const limit = response.headers['x-ratelimit-limit'];
                const reset = response.headers['x-ratelimit-reset'];
                
                if (remaining && parseInt(remaining) < 10) {
                    logger.warn(`Rate limit warning: ${remaining}/${limit} requests remaining`);
                }
            }
            
            return response;
        } catch (error) {
            if (error.response?.status === 429 && retryCount < this.rateLimitConfig.maxRetries) {
                const retryAfter = error.response.headers['retry-after'];
                const resetTime = error.response.headers['x-ratelimit-reset'];
                
                let delayTime = this.rateLimitConfig.baseDelay * Math.pow(2, retryCount);
                
                if (retryAfter) {
                    delayTime = parseInt(retryAfter) * 1000;
                } else if (resetTime) {
                    const resetTimestamp = parseInt(resetTime) * 1000;
                    delayTime = Math.max(resetTimestamp - Date.now(), delayTime);
                }
                
                delayTime = Math.min(delayTime, this.rateLimitConfig.maxDelay);
                
                logger.warn(`Rate limit exceeded. Retrying in ${delayTime}ms (attempt ${retryCount + 1}/${this.rateLimitConfig.maxRetries})`);
                await this.delay(delayTime);
                
                return this.makeRequestWithRetry(requestFn, retryCount + 1);
            }
            
            throw error;
        }
    }

    // Helper method to create delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async setPriority(ticketId, { priority }) {
        try {
            if (priority === undefined) {
                throw new Error('Priority is required for update');
            }
            
            const response = await this.makeRequestWithRetry(() => 
                this.api.put(`/task/${ticketId}`, { priority })
            );
            
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
            
            const response = await this.makeRequestWithRetry(() => 
                this.api.post(`/task/${ticketId}/tag/${encodeURIComponent(tagName)}`)
            );
            
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
            let response = await this.makeRequestWithRetry(() => 
                this.api.post(`/task/${ticketId}/field/${fieldId}`, { value })
            );
            
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
            let response = await this.makeRequestWithRetry(() => 
                this.api.put(`/task/${ticketId}`, { assignees: {add: assignees} })
            );
            
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

            while (true) {
                const res = await this.makeRequestWithRetry(() => 
                    this.api.get(`list/${listId}/task`, {
                        params: {
                            archived: false,
                            include_closed: true,
                            date_done_gt: startDate,
                            date_done_lt: endDate,
                            limit: 100,
                            page: page
                        }
                    })
                );

                if (res.data.tasks && res.data.tasks.length > 0) {
                    allTickets = [...allTickets, ...res.data.tasks];
                }

                // Use last_page to determine if we should continue
                if (res.data.last_page) {
                    break;
                }

                page++;
            }

            if (allTickets.length === 0) {
                return [];
            }

            if (includeTimeLine) {
                // Process tickets in batches to avoid overwhelming the API
                const batchSize = 45;
                let tickets = [];
                
                for (let i = 0; i < allTickets.length; i += batchSize) {
                    const batch = allTickets.slice(i, i + batchSize);
                    const batchTickets = await Promise.all(
                        batch.map(async (ticket) => {
                            let response = await this.makeRequestWithRetry(() => 
                                this.api.get(`task/${ticket.id}/time_in_status`)
                            );                        
                            return new ReportTicket(response.data, ticket);
                        })
                    );
                    tickets = [...tickets, ...batchTickets];
                    
                    // Add delay between batches
                    if (i + batchSize < allTickets.length) {
                        await this.delay(200); // 200ms delay between batches
                    }
                }

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
            let response = await this.makeRequestWithRetry(() => 
                this.api.get(`list/${id}`)
            );
            return response.data;
        } catch (error) {
            logger.error('Error fetching list:', error.response?.data || error.message);
            throw error;
        }
    }

    async getTicket(id) {
        try {
            let response = await this.makeRequestWithRetry(() => 
                this.api.get(`/task/${id}`)
            );
            return new HistoryTicket(response.data);       
        } catch (error) {
            logger.error('Error fetching ticket:', error.response?.data || error.message);
            throw error;
        }
    }

    async getLists(folderId, exceptForLists = []) {
        try {
            let response = await this.makeRequestWithRetry(() => 
                this.api.get(`folder/${folderId}/list`)
            );
            return response.data.lists.map(list => new List(list)).filter(list => !exceptForLists.includes(list.id));
        } catch (error) {
            logger.error('Error fetching lists:', error.response?.data || error.message);
            throw error;
        }
    }
}