const bbCore = require('../sdk');

const sendToRaygun = require('./send-to-raygun');

const getSubdomain = () => {
    const apiUrl = bbCore.context.apiUrl;

    const subdomainMatch = /\/\/([^.]*)\./.exec(apiUrl);
    if (!subdomainMatch)
        return 'UNKNOWN';

    return subdomainMatch[1].toUpperCase();
};

const sendToRaygunExtApp = error => {
    const apiKey = bbCore.getConfigValue('raygunApiKey');
    const env = getSubdomain();

    sendToRaygun({
        apiKey,
        error,
        env,
        groupingKeyBase: `${env}${error.message}`,
        failureCallback: (err) => {
            console.error('sendToRaygunExtApp failed', err);
        },
    });
};

module.exports = { sendToRaygunExtApp };