export default class Ticket {
    constructor(data) {
        this.id = data.id;
        this.origin = (() => {
            let originField = Array.isArray(data.custom_fields) 
                ? data.custom_fields.find(cf => cf.name === "🔧 Origem")
                : null;
            
            let originOption = originField?.type_config?.options?.[originField.value];
            
            return originOption ? {
                field_id: originField.id,
                value: originField.value,
                option: {
                    id: originOption.id,
                    name: originOption.name,
                    color: originOption.color,
                    orderindex: originOption.orderindex
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
        this.priority = data.priority.priority;
        this.tags = data.tags || [];
        this.assignees = (data.assignees || []).map(a => {
            return {
                id: a.id,
                username: a.username
            }
        });
    }
}