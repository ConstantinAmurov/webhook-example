const { jsonSchemaValidate } = require('./dependencies');

const { getConfItem, setConfItem } = require('./utils/config');
const log = require('./utils/logger');
const configSchema = require('./config-schema');

const getWebhookConfig = (data, callback) => {
    try {
        const configJson = getConfItem('configJson') || '[]';
        callback(null, { config: JSON.parse(configJson) });
    } catch (error) {
        error.source = error.source || 'config.js -> getWebhookConfig';
        log('error', `[${error.source}]`, error, true);
        callback(new Error(`Failed to retrieve app config. Error: ${error.message}.`));
    }
};

const validateConfig = configJson => {
    let config;

    try {
        config = JSON.parse(configJson);
    } catch (error) {
        const err = new Error(`Invalid JSON format (${error.message})`);
        err.source = 'config.js -> validateConfig';
        throw err;
    }

    const { errors } = jsonSchemaValidate(config, configSchema);

    if (errors.length > 0) {
        const err = new Error(errors[0].stack);
        err.source = 'config.js -> validateConfig';
        throw err;
    }

    return config;
};

const saveWebhookConfig = (data, callback) => {
    try {
        const { configJson } = data;
        const config = validateConfig(configJson);
        setConfItem('configJson', JSON.stringify(config));
        callback(null, { config });
    } catch (error) {
        error.source = error.source || 'config.js -> saveWebhookConfig';
        log('error', `[${error.source}]`, error, true);
        callback(new Error(`Failed to save app config. Error: ${error.message}.`));
    }
};

const setWebHookConfigDefaultValues = (config) => {
    config.events = config.events || [];
    config.triggerFor = config.triggerFor || {};
    config.triggerFor.companies = config.triggerFor.companies || [];
    config.triggerFor.staffGroups = config.triggerFor.staffGroups || [];
};

module.exports = {
    getWebhookConfig,
    saveWebhookConfig,
    setWebHookConfigDefaultValues
};