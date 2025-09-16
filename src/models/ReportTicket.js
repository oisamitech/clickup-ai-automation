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

            data.status_history?.map((sh) => {
                if (sh.type != "closed") {
                    let time = sh.total_time?.by_minute || 0;  // ✅ Proteção contra null
                    totalTime = totalTime + time;
                }
            });
            return totalTime;
        })();
        this.timiLine = (() => {
            let timiLineField = ticketData.custom_fields?.find(cf => cf.name === "Data de Conclusão");
            return timiLineField?.value || null;  // ✅ Proteção contra undefined
        })();
        this.origin = this.origin?.option?.name || null;  // ✅ Proteção dupla
        this.product = this.product?.option?.name || null;  // ✅ Proteção dupla
        this.squad = this.squad?.option?.name || null;  // ✅ Proteção contra null
        this.tags = this.tags?.[0]?.name || null;  // ✅ Proteção contra array vazio
    } 
}