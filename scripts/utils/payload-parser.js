const bbCore = require('../sdk');

const getGroupedLiquidItems = (payload) => {
    const liquidItemRegex = /\{\{[^}]+\}\}/g; // {{person.name}}
    const liquidItems = payload.match(liquidItemRegex);

    const existingEntities = [
        "person",
        "client",
        "company",
        // "address",
        // "resource",
        "service",
        "slot",
        // "total",
        // "item",
        // "app",
        // "object",
        // "attendance",
        // "attendee",
        // "extra_data",
        // "message",
        "event_chain",
        'user',
        // 'recipient',
        // 'category',
    ];

    const entityRegex = new RegExp(`(${existingEntities.join('|')})(?=\\.)`);
    const liquidGroups = {};

    liquidItems.forEach(liquidItem => {
        const entities = liquidItem.match(entityRegex);
        const entity = entities ? entities[0] : 'noEntity';
        if (!liquidGroups.hasOwnProperty(entity))
            liquidGroups[entity] = {};

        const key = liquidItem.replace(/[{}]/g, '');
        liquidGroups[entity][key] = liquidItem;
    });

    if (liquidGroups.hasOwnProperty('noEntity')) {
        const entities = Object.keys(liquidGroups); // [person,client,noEntity]
        if (entities.length === 1) {
            liquidGroups.booking = liquidGroups.noEntity;
        }
        else {
            const randomEntity = entities.filter(entity => entity !== 'noEntity')[0];
            liquidGroups[randomEntity] = { ...liquidGroups[randomEntity], ...liquidGroups.noEntity };
        }
        delete liquidGroups.noEntity;
    }

    return liquidGroups;
};

const getEntityId = (entity, booking) => {
    return booking[entity + '_id'];
};

const getResolvedLiquidItems = async (groupedLiquidItems, booking) => {
    const company = await bbCore.getCompany();
    const requests = [];

    for (const [entity, liquidItemsGroup] of Object.entries(groupedLiquidItems)) {
        const entityId = getEntityId(entity, booking);

        const payload = {
            entity,
            id: entityId,
            liquid_template: JSON.stringify(liquidItemsGroup)
        };
        requests.push(company.$post('liquid_renderer', payload));
    }

    let results = await Promise.all(requests);

    return results.reduce((resolvedLiquidItems, result) => ({ ...resolvedLiquidItems, ...JSON.parse(result.liquid_render) }), {});
};

const getResolvedPayload = async (payload, booking) => {
    payload = JSON.stringify(payload);

    // Remove spaces next to tags
    payload = payload.replace(/(?<=\{\{)\s*/g, ''); // {{   person.name   }} -> {{person.name   }}
    payload = payload.replace(/\s*(?=\}\})/g, '');  // {{person.name   }} -> {{person.name}}

    const groupedLiquidItems = getGroupedLiquidItems(payload);
    const resolvedLiquidItems = await getResolvedLiquidItems(groupedLiquidItems, booking);

    for (let [liquidItem, jrniValue] of Object.entries(resolvedLiquidItems)) {
        liquidItem = "{{" + liquidItem + "}}";
        payload = payload.split(liquidItem).join(jrniValue);
    }
    return payload;
};

module.exports = {
    getResolvedPayload
};