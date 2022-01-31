const bbCore = require('../sdk');

const getCustomResolvedPayloads = async (payloads, booking) => {
    try {
        payloads = payloads.map(payload => {
            let jsonPayload = JSON.stringify(payload);
            jsonPayload = jsonPayload.replace(/(?<=\[\[)\s*/g, ''); // "   [[   custom_item   ]]   " -> "   [[custom_item   ]]   "
            jsonPayload = jsonPayload.replace(/\s*(?=\]\])/g, '');  // "   [[custom_item   ]]   " -> "   [[custom_item]]   "
            jsonPayload = jsonPayload.replace(/(?<=")\s+(?=\[\[)/g, ''); // "   [[custom_item]]   " -> "[[custom_item]]   "
            jsonPayload = jsonPayload.replace(/(?<=\]\])\s+(?=")/g, '');  // "[[custom_item]]   " -> "[[custom_item]]"
            return jsonPayload;
        });

        let joinedPayloads = payloads.join('');
        const customItemRegex = /\[\[[^\]]+\]\]/g; // [[custom_item]]
        const hasCustomItems = customItemRegex.test(joinedPayloads);

        if (hasCustomItems) {
            const customPayload = await requestCustomPayload(booking);
            for (let [customItem, jrniValue] of Object.entries(customPayload)) {
                customItem = `"[[${customItem}]]"`;
                payloads.forEach((payload, index) => {
                    payloads[index] = payload.split(customItem).join(JSON.stringify(jrniValue));
                });
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

const requestCustomPayload = async (booking) => {
    try {
        const company = await bbCore.getCompany();
        const app = await company.$get('apps', { app_name: 'jrni-data-webhook-extension' });

        const { data } = await app.$post('admin_script', { name: 'generate-payload' }, booking);
        return data;
    }
    catch (error) {
        error.source = error.source || 'custom-payload-parser.js -> requestCustomPayload';
        throw error;
    }
};

module.exports = { getCustomResolvedPayloads };