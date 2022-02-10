const bbCore = require('../sdk');

const getResolvedLiquidItems = async (payloads, booking) => {
    try {
        const company = await bbCore.getCompany();
        const requests = [];

        payloads.forEach((payload) => {
            const params = {
                entity: 'booking',
                id: booking.id,
            };
            const data = {
                version: 'V4',
                liquid_template: payload
            };
            requests.push(company.$post('liquid_renderer', params, data));
        });

        let results = await Promise.all(requests);

        results = results.map((result) => JSON.parse(result.liquid_render));

        return results;
    } catch (error) {
        error.source = error.source || 'liquid-payload-parser.js -> getResolvedLiquidItems';
        throw error;
    }
};

const getLiquidResolvedPayloads = async (payloads, booking) => {
    try {
        payloads = payloads.map(payload => {
            // Remove spaces next to tags
            payload = payload.replace(/(?<=\{\{)\s*/g, ''); // {{   person.name   }} -> {{person.name   }}
            payload = payload.replace(/\s*(?=\}\})/g, '');  // {{person.name   }} -> {{person.name}}
            return payload;
        });

        const resolvedLiquidItems = await getResolvedLiquidItems(payloads, booking);

        return resolvedLiquidItems;
    } catch (error) {
        error.source = error.source || 'liquid-payload-parser.js -> getLiquidResolvedPayloads';
        throw error;
    }
};

module.exports = {
    getLiquidResolvedPayloads
};