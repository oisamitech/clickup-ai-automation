export default class ReportTicket {
    constructor(id, data, custom_fields) {
        this.ticketId = id;
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
        this.assignees = (data.assignees || []).map(a => {
            return {
                id: a.id,
                username: a.username
            }
        });
        this.timeLine = {
            value: custom_fields.value,
            valueRichText: custom_fields.value_richtext
        };
    } 
}