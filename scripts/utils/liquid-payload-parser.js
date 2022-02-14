const bbCore = require('../sdk');

const getLiquidResolvedPayloads = async (liquidPayloads, booking) => {
    try {
        const company = await bbCore.getCompany();
        const requests = [];

        liquidPayloads.forEach((liquidPayload) => {
            const params = {
                entity: 'booking',
                id: booking.id,
            };
            const data = {
                version: 'V4',
                liquid_template: liquidPayload
            };
            requests.push(company.$post('liquid_renderer', params, data));
        });

        let results = await Promise.all(requests);

        results = results.map((result) => JSON.parse(result.liquid_render));

        return results;
    } catch (error) {
        error.source = error.source || 'liquid-payload-parser.js -> getLiquidResolvedPayloads';
        throw error;
    }
};

module.exports = {
    getLiquidResolvedPayloads
};