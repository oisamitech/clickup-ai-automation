export default class TicketInTime {
    constructor(id, status_history, assignees) {
        this.ticketId = id;
        this.inProgressTime = (() => {
            let status = status_history?.find(sh => sh.status === "em andamento")

            return status?.total_time?.by_minute;
        })();
        this.notStartedTime = (() => {
            let status = status_history?.find(sh => sh.status === "backlog");
            
            return status?.total_time?.by_minute;
        })();
        this.leadTime = (() => {
            let totalTime = 0;

            status_history.map((sh) => {
                if (sh.type != "closed") {
                    let time = sh.total_time.by_minute;
                    totalTime = totalTime + time;
                }
            });
            return totalTime;
        })();
        this.assignees = assignees;
    } 
}