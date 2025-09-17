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
            totalTime: (() => {
                let time = 0;
                tickets.map((ticket) => {
                    time = time + ticket.leadTime;
                });
                return time;
            })(),
            allTickets: tickets
        };
    }
}