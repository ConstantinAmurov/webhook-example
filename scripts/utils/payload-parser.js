const bbCore = require('../sdk');

const getGroupedLiquidItems = (payload) => {
    const liquidItemRegex = /\{\{[^{}]+\}\}/g; // {{person.name}}
    const liquidItems = payload.match(liquidItemRegex);

    if (liquidItems === null) return {};

    const existingEntities = [
        'booking',
        'company',
        // 'address',
        'person',
        'resource',
        'service',
        'client',
        'slot',
        // 'total',
        // 'item',
        // 'app',
        // 'object',
        // 'attendance',
        // 'attendee',
        // 'extra_data',
        // 'message',
        'event_chain',
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
        const entities = Object.keys(liquidGroups);
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
    switch (entity) {
        case 'booking':
            return booking.id;

        default:
            return booking[`${entity}_id`];
    }
};

const getResolvedLiquidItems = async (groupedLiquidItems, booking) => {
    try {
        const company = await bbCore.getCompany();
        const requests = [];

        for (const [entity, liquidItemsGroup] of Object.entries(groupedLiquidItems)) {
            const entityId = getEntityId(entity, booking);

            const params = {
                entity,
                id: entityId,
            };
            const data = {
                version: 'V4',
                liquid_template: JSON.stringify(liquidItemsGroup)
            };
            requests.push(company.$post('liquid_renderer', params, data));
        }

        const results = await Promise.all(requests);
        return results.reduce((resolvedLiquidItems, result) => ({ ...resolvedLiquidItems, ...JSON.parse(result.liquid_render) }), {});
    } catch (error) {
        error.source = error.source || 'payload-parser.js -> getResolvedLiquidItems';
        throw error;
    }
};

const getResolvedPayload = async (payload, booking) => {
    try {
        payload = JSON.stringify(payload);

        // Remove spaces next to tags
        payload = payload.replace(/(?<=\{\{)\s*/g, ''); // {{   person.name   }} -> {{person.name   }}
        payload = payload.replace(/\s*(?=\}\})/g, '');  // {{person.name   }} -> {{person.name}}

        const groupedLiquidItems = getGroupedLiquidItems(payload);
        const resolvedLiquidItems = await getResolvedLiquidItems(groupedLiquidItems, booking);

        for (let [liquidItem, jrniValue] of Object.entries(resolvedLiquidItems)) {
            liquidItem = '{{' + liquidItem + '}}';
            payload = payload.split(liquidItem).join(jrniValue);
        }

        payload = JSON.parse(payload);
        return payload;
    } catch (error) {
        error.source = error.source || 'payload-parser.js -> getResolvedPayload';
        throw error;
    }
};

const getResolvedPayloads = async (payloads, booking) => {
    try {
        payloads = payloads.map(payload => {
            let jsonPayload = JSON.stringify(payload);

            // Remove spaces next to tags
            jsonPayload = jsonPayload.replace(/(?<=\{\{)\s*/g, ''); // {{   person.name   }} -> {{person.name   }}
            jsonPayload = jsonPayload.replace(/\s*(?=\}\})/g, '');  // {{person.name   }} -> {{person.name}}

            return jsonPayload;
        });

        let joinedPayloads = payloads.join('');

        const groupedLiquidItems = getGroupedLiquidItems(joinedPayloads);
        const resolvedLiquidItems = await getResolvedLiquidItems(groupedLiquidItems, booking);

        for (let [liquidItem, jrniValue] of Object.entries(resolvedLiquidItems)) {
            liquidItem = '{{' + liquidItem + '}}';
            payloads.forEach((payload, index) => {
                payloads[index] = payload.split(liquidItem).join(jrniValue);
            });
        }

        payloads = payloads.map(payload => JSON.parse(payload));
        return payloads;
    } catch (error) {
        error.source = error.source || 'payload-parser.js -> getResolvedPayloads';
        throw error;
    }
};

module.exports = {
    getResolvedPayload,
    getResolvedPayloads
};