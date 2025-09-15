import Ticket from "./Ticket.js";

export default class ReportTicket extends Ticket {
    constructor(data, ticketData) {
        super(ticketData);
        this.inProgressTime = (() => {
            let status = data.status_history?.find(sh => sh.status === "em andamento")

            return status?.total_time?.by_minute;
        })();
        this.notStartedTime = (() => {
            let status = data.status_history?.find(sh => sh.status === "backlog");
            
            return status?.total_time?.by_minute;
        })();
        this.leadTime = (() => {
            let totalTime = 0;

            data.status_history.map((sh) => {
                if (sh.type != "closed") {
                    let time = sh.total_time.by_minute;
                    totalTime = totalTime + time;
                }
            });
            return totalTime;
        })();
        this.timiLine = (() => {
            let timiLineField = ticketData.custom_fields.find(cf => cf.name === "Data de Conclusão");
            return timiLineField.value;
        })();
    } 
}