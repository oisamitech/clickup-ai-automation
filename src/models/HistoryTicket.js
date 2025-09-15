import Ticket from "./Ticket.js";

export default class HistoryTicket extends Ticket {
    constructor(data) {
        super(data);
        this.name = data.name;
        this.description = data.description;
    }
}