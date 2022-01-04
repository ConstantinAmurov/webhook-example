const { axios } = require('./dependencies');

const log = require('./utils/logger');
const { isDuplicateTrigger } = require('./check-trigger');
const { getConfItem } = require('./utils/config');
const { getResolvedPayload, getResolvedPayloads } = require('./utils/payload-parser');

const filterConfig = async (event, config, booking) => {
    // 1st phase (no additional data required from JRNI)
    config = config.filter(configItem => {
        if (configItem.events.length > 0 && !configItem.events.includes(event))
            return false;

        if (configItem.triggerFor.companies.length > 0 && !configItem.triggerFor.companies.includes(booking.company_id))
            return false;

        return true;
    });

    // 2nd phase (additional data required from JRNI)
    const liquidItemsForAdditionalFiltering = {};
    config.forEach(configItem => {
        if (configItem.triggerFor.staffGroups.length > 0)
            liquidItemsForAdditionalFiltering.personGroupId = '{{person.group_id}}';
    });

    if (Object.keys(liquidItemsForAdditionalFiltering).length === 0)
        return config;

    const additionalFilters = await getResolvedPayload(liquidItemsForAdditionalFiltering, booking);
    config = config.filter(configItem => {
        if (configItem.triggerFor.staffGroups.length > 0 && !configItem.triggerFor.staffGroups.includes(parseInt(additionalFilters.personGroupId)))
            return false;

        return true;
    });

    return config;
};

const sendData = async (config, booking) => {
    let payloads = config.map(configItem => configItem.payload);
    payloads = await getResolvedPayloads(payloads, booking);

    const requests = config.map((configItem, configItemIndex) => {
        const headers = {
            'Content-Type': 'application/json'
        };

        const data = payloads[configItemIndex];

        return axios({
            method: 'post',
            url: configItem.url,
            headers,
            data
        });
    });

    await Promise.all(requests);
};

const afterCreateBooking = (data, callback) => {
    log('info', '[afterCreateBooking] data', data);
    callback(null, {});
};

const afterUpdateBooking = async (data, callback) => {
    try {
        // There is some weird caching issue sometimes so make sure we have the right data
        const booking = await data.booking.$get('self', { no_cache: true });

        // Detect if it is duplicate trigger (the issue related to multiple triggers for a single update)
        const duplicateCheckPayload = {
            id: booking.id,
            company_id: booking.company_id,
            datetime: booking.datetime,
            person_id: booking.person_id,
            current_multi_status: booking.current_multi_status ? booking.current_multi_status : 'confirmed'
        };

        if (await isDuplicateTrigger(duplicateCheckPayload)) {
            log('warn', '[afterUpdateBooking] DUPLICATE TRIGGER, execution aborted', '', true);
            callback(null, {});
            return;
        }

        // Filter the config
        const configJson = getConfItem('configJson') || '[]';
        let config = JSON.parse(configJson);
        config = await filterConfig('update', config, booking);

        await sendData(config, booking);

        callback(null, {});
    } catch (error) {
        log('error', '[afterUpdateBooking] Error', error, true);
        callback(new Error(`The afterUpdateBooking handler failed. Error: ${error.message}.`));
    }
};

const afterDeleteBooking = (data, callback) => {
    log('info', '[afterDeleteBooking] data', data);
    callback(null, {});
};

module.exports = {
    afterCreateBooking,
    afterUpdateBooking,
    afterDeleteBooking
};