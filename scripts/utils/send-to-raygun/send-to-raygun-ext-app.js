const bbCore = require('../../sdk');

const { getConfItem } = require('../config');
const log = require('../logger');
const sendToRaygun = require('./send-to-raygun');

const getSubdomain = () => {
    const apiUrl = bbCore.context.apiUrl;

    const subdomainMatch = /\/\/([^.]*)\./.exec(apiUrl);
    if (!subdomainMatch)
        return 'UNKNOWN';

    return subdomainMatch[1].toUpperCase();
};

const sendToRaygunExtApp = error => {
    const apiKey = getConfItem('raygunApiKey');
    const env = getSubdomain();

    sendToRaygun({
        apiKey,
        error,
        env,
        groupingKeyBase: `${env}${error.message}`,
        failureCallback: (err) => {
            err.source = err.source || 'send-to-raygun-ext-app.js -> sendToRaygunExtApp';
            log('error', `[${err.source}]`, err, true);
        },
    });
};

module.exports = { sendToRaygunExtApp };