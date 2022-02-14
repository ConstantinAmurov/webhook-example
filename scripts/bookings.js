const { axios } = require('./dependencies');

const log = require('./utils/logger');
const { isDuplicateTrigger } = require('./check-trigger');
const { getConfItem } = require('./utils/config');
const { setWebHookConfigDefaultValues } = require('./config');
const { getLiquidResolvedPayloads } = require('./utils/liquid-payload-parser');
const { getCustomResolvedPayloads } = require('./utils/custom-payload-parser');
const { updateAxiosOptionsForMtls } = require('./utils/auth/mtls');
const { updateAxiosOptionsForAuth } = require('./utils/auth/auth');
const { getCompaniesChildrenIds, getStaffGroupId } = require('./utils/jrni');

const filterConfig = async (event, config, booking) => {
    try {
        // 1st phase (no additional data required from JRNI)
        config = config.filter(configItem => {
            if (configItem.events.length > 0 && !configItem.events.includes(event))
                return false;

            if (configItem.triggerFor.companies.length > 0 && !configItem.triggerFor.companies.includes(booking.company_id))
                return false;

            return true;
        });

        // 2nd phase (additional data required from JRNI)
        const requireAdditionalFilters = config.some((configItem) => configItem.triggerFor.hasOwnProperty('staffGroups'));
        if (!requireAdditionalFilters)
            return config;

        const staffGroupId = await getStaffGroupId(booking.company_id, booking.person_id);

        config = config.filter(configItem => configItem.triggerFor.staffGroups.length === 0 || configItem.triggerFor.staffGroups.includes(staffGroupId));

        return config;
    } catch (error) {
        error.source = error.source || 'booking.js -> filterConfig';
        throw error;
    }
};

const updateTriggerForCompanies = async (config) => {
    try {
        const requests = config.map((configItem) => getCompaniesChildrenIds(configItem.triggerFor.parentCompanies));
        const companiesChildrenIds = await Promise.all(requests);
        config.forEach((configItem, configIndex) => {
            configItem.triggerFor.companies = [...configItem.triggerFor.companies, ...companiesChildrenIds[configIndex]];
            configItem.triggerFor.companies = configItem.triggerFor.companies.filter((company) => !configItem.triggerFor.excludedCompanies.includes(company));
        });
    }
    catch (error) {
        error.source = error.source || 'booking.js -> updateTriggerForCompanies';
        throw error;
    }
};

const sendData = async (config, booking) => {
    try {
        const liquidPayloads = config.map(configItem => configItem.payload);
        const tempPayload = ['{% assign total = booking.total %}  {% assign items = total.items %} {% comment %} does not include cancelled bookings {% endcomment %} {% assign printableItems = total.printable_items %} {% comment %} includes cancelled bookings {% endcomment %} {% assign printableItem = total.printable_items[0] %} {% assign space = printableItem.all_spaces.first %} {% assign slot = space.slot %} {% assign resource = slot.resource %} {%- assign companyName = slot.company.name -%} {%- assign memberName = slot.member.name -%} {%- assign addressMulti = slot.address.multiline_print -%}  {%- assign dateTime = space.date_time | date: " % A % e % B % Y % H:% M" -%} {%- assign refNum = space.id -%} {%- assign service = slot.service -%}  { "serviceName": "{{booking.service_name}}" , "guid": "[[guid]]" }'];
        let payloads = await getLiquidResolvedPayloads(tempPayload, booking);
        payloads = await getCustomResolvedPayloads(payloads, booking);

        const requests = config.map(async (configItem, configItemIndex) => {
            const axiosOptions = {
                method: 'post',
                url: configItem.url,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: payloads[configItemIndex]
            };

            if (configItem.mtls)
                await updateAxiosOptionsForMtls(axiosOptions, configItem.mtls);

            if (configItem.auth)
                await updateAxiosOptionsForAuth(axiosOptions, configItem.auth);

            return axios(axiosOptions);
        });

        await Promise.all(requests);
    } catch (error) {
        error.source = error.source || 'booking.js -> sendData';
        throw error;
    }
};

const afterCreateBooking = async (data, callback) => {
    try {
        // There is some weird caching issue sometimes so make sure we have the right data
        const booking = await data.booking.$get('self', { no_cache: true });

        // Filter the config
        const configJson = getConfItem('configJson') || '[]';
        let config = JSON.parse(configJson);
        setWebHookConfigDefaultValues(config);
        await updateTriggerForCompanies(config);
        config = await filterConfig('create', config, booking);

        await sendData(config, booking);

        callback(null, {});
    }
    catch (error) {
        error.source = error.source || 'booking.js -> afterCreateBooking';
        log('error', `[${error.source}]`, error, true);
        callback(new Error(`The afterCreateBooking handler failed. Error: ${error.message}.`));
    }
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
            log('warn', '[booking.js -> afterUpdateBooking] DUPLICATE TRIGGER, execution aborted', '', true);
            callback(null, {});
            return;
        }

        // Filter the config
        const configJson = getConfItem('configJson') || '[]';
        let config = JSON.parse(configJson);
        setWebHookConfigDefaultValues(config);
        await updateTriggerForCompanies(config);
        config = await filterConfig('update', config, booking);

        await sendData(config, booking);

        callback(null, {});
    } catch (error) {
        error.source = error.source || 'booking.js -> afterUpdateBooking';
        log('error', `[${error.source}]`, error, true);
        callback(new Error(`The afterUpdateBooking handler failed. Error: ${error.message}.`));
    }
};

const afterDeleteBooking = async (data, callback) => {
    try {
        // There is some weird caching issue sometimes so make sure we have the right data
        const booking = await data.booking.$get('self', { no_cache: true });

        // Filter the config
        const configJson = getConfItem('configJson') || '[]';
        let config = JSON.parse(configJson);
        setWebHookConfigDefaultValues(config);
        await updateTriggerForCompanies(config);
        config = await filterConfig('cancel', config, booking);

        await sendData(config, booking);

        callback(null, {});
    }
    catch (error) {
        error.source = error.source || 'booking.js -> afterDeleteBooking';
        log('error', `[${error.source}]`, error, true);
        callback(new Error(`The afterDeleteBooking handler failed. Error: ${error.message}.`));
    }
};

module.exports = {
    afterCreateBooking,
    afterUpdateBooking,
    afterDeleteBooking
};