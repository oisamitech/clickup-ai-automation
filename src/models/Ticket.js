export default class Ticket {
    constructor(data) {
        this.id = data.id;
        this.assignees = (data.assignees || []).map(a => {
            return {
                id: a.id,
                username: a.username
            }
        });
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
    }
}