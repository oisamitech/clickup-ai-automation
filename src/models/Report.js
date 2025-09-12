export default class Report {
    constructor (listId, listName, startDate, endDate, tickets) {
        this.list = {
            listId: listId,
            listName: listName,
        };
        this.startDate = startDate;
        this.endDate = endDate;
        this.tickets = {
            total: tickets.length,
            allTickets: tickets
        };
    }
}