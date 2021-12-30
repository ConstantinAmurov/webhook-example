const { getConfItem, setConfItem } = require('./utils/config');
const log = require('./utils/logger');
const { jsonSchemaValidate } = require('./dependencies');
const configSchema = require('./config-schema');

const getWebhookConfig = (data, callback) => {
    try {
        const configJson = getConfItem('configJson') || '[]';
        callback(null, { config: JSON.parse(configJson) });
    } catch (error) {
        log('error', '[getWebhookConfig] Error', error, true);
        callback(new Error(`Failed to retrieve app config. Error: ${error.message}.`));
    }
};

const validateConfig = configJson => {
    let config;

    try {
        config = JSON.parse(configJson);
    } catch (error) {
        throw new Error(`Invalid JSON format (${error.message})`);
    }

    const { errors } = jsonSchemaValidate(config, configSchema);

    if (errors.length > 0)
        throw new Error(errors[0].stack);

    return config;
};

const saveWebhookConfig = (data, callback) => {
    const { configJson } = data;

    try {
        const config = validateConfig(configJson);
        setConfItem('configJson', JSON.stringify(config));
        callback(null, { config });
    } catch (error) {
        log('error', '[saveWebhookConfig] Error', error, true);
        callback(new Error(`Failed to save app config. Error: ${error.message}.`));
    }
};

module.exports = {
    getWebhookConfig,
    saveWebhookConfig
};