import Ticket from "./Ticket.js";

export default class ReportTicket extends Ticket {
    constructor(data, ticketData) {
        super(ticketData);
        this.notStartedTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "backlog");
            
            return status?.total_time?.by_minute;
        })();
        this.inProgressTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "em andamento")

            return status?.total_time?.by_minute;
        })();
        this.waitingPartnerTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "aguardando parcerios");

            return status?.total_time?.by_minute;
        })();
        this.waitingSquadTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "aguardando squad");

            return status?.total_time?.by_minute;
        })();
        this.waitingCollaboratorTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "aguardando solicitante ");

            return status?.total_time?.by_minute;
        })();
        this.waitingRequestTime = (() => {
            let status = data?.status_history?.find(sh => sh.status === "solicitações ");

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
        this.concluionDate = (() => {
            if (!ticketData?.date_done) return null;
            let date = new Date(parseInt(ticketData.date_done));
            return isNaN(date.getTime()) ? null : date.toLocaleDateString('pt-BR');
        })();
        this.concluionTime = (() => {
            if (!ticketData?.date_done) return null;
            let date = new Date(parseInt(ticketData.date_done));
            return isNaN(date.getTime()) ? null : date.toLocaleTimeString('pt-BR');
        })();
        
        // Data de criação
        this.creationDate = (() => {
            if (!ticketData?.date_created) return null;
            let date = new Date(parseInt(ticketData.date_created));
            return isNaN(date.getTime()) ? null : date.toLocaleDateString('pt-BR');
        })();
        this.creationTime = (() => {
            if (!ticketData?.date_created) return null;
            let date = new Date(parseInt(ticketData.date_created));
            return isNaN(date.getTime()) ? null : date.toLocaleTimeString('pt-BR');
        })();
        this.time_estimate = ticketData?.time_estimate ? Math.round(ticketData.time_estimate / 60000) : null;
    } 
}