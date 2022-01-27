const bbCore = require('../sdk');

const getCustomResolvedPayloads = async (payloads, booking) => {
    try {
        for (payload of payloads) {
            const jsonPayload = JSON.stringify(payload);
            const customItemRegex = /\[.*?\]]/g; // [[custom_item]]
            const customItems = jsonPayload.match(customItemRegex);
            if (customItems.length > 0) {
                const customPayload = await requestCustomPayload(url, booking);
                console.log('customPayload');
                console.log(customPayload);
            }
        }

        payloads = payloads.map(payload => JSON.parse(payload));
        return payloads;
    }
    catch (error) {
        error.source = error.source || 'custom-payload-parser.js -> getCustomResolvedPayloads';
        throw error;
    }

};

const requestCustomPayload = (url, booking) => {
    try {
        const app = await bbCore.getApp();
        const { data } = await app.$post('admin_script', { name: 'generate-payload' }, booking);

        return data;
    }
    catch (error) {
        error.source = error.source || 'custom-payload-parser.js -> requestCustomPayload';
        throw error;
    }
};

module.exports = { getCustomResolvedPayloads };
