const bbCore = require('../sdk');

/*
    Extract the environment from URL (apiUrl).
    The function will return one of these values: dev, staging, prod.
*/
const getEnv = () => {
    const apiUrl = bbCore.context.apiUrl;

    const subdomainMatch = /\/\/([^.]*)\./.exec(apiUrl);
    if (!subdomainMatch)
        return 'dev';

    const subdomain = subdomainMatch[1];
    const subdomainParts = subdomain.split('-');
    return subdomainParts.length == 1 ? 'prod' : subdomainParts[1];
};

module.exports = {
    getEnv
};