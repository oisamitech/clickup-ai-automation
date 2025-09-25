import Ticket from "./Ticket.js";

export default class ReportTicket extends Ticket {
    constructor(data, ticketData) {
        super(ticketData);
        this.inProgressTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "em andamento")

            return status?.total_time?.by_minute;
        })();
        this.notStartedTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "backlog");
            
            return status?.total_time?.by_minute;
        })();
        this.leadTime = (() => {
            let totalTime = data?.status_history
                ?.filter(sh => sh.type !== "closed")
                .reduce((total, sh) => total + (sh.total_time?.by_minute || 0), 0);

            return totalTime;
        })();
        this.timiLine = (() => {
            let timiLineField = ticketData.custom_fields?.find(cf => cf.name === "Data de Conclusão");
            return timiLineField?.value || null; 
        })();
        this.origin = this.origin?.option?.name || null;
        this.product = this.product?.option?.name || null; 
        this.squad = this.squad?.option?.name || null; 
        this.tags = this.tags?.[0]?.name || null;
        this.assignees = this.assignees.map(assignee => assignee.username).join(", ");
    } 
}