import Ticket from "./Ticket.js";

export default class HistoryTicket extends Ticket {
    constructor(data) {
        super(data);
        this.name = data.name;
        this.description = data.description;
        this.tags = data.tags || [];
        this.squad = (() => {
            let squadField = Array.isArray(data.custom_fields) 
                ? data.custom_fields.find(cf => cf.name === "SQUAD")
                : null;
            
            let squadOption = squadField?.type_config?.options?.[squadField.value];
            
            return squadOption ? {
                field_id: squadField.id,
                value: squadField.value,
                option: {
                    id: squadOption.id,
                    name: squadOption.name,
                    color: squadOption.color,
                    orderindex: squadOption.orderindex
                }
            } : null;
        })();
        this.product = (() => {
            let productField = Array.isArray(data.custom_fields) 
                ? data.custom_fields.find(cf => cf.name === "Produto")
                : null;

            let productOption = productField?.type_config?.options?.[productField.value];

            return productOption ? {
                field_id: productField.id,
                value: productField.value,
                option: {
                    id: productOption.id,
                    name: productOption.name,
                    color: productOption.color,
                    orderindex: productOption.orderindex
                }
            } : null;
        })();
    }
}