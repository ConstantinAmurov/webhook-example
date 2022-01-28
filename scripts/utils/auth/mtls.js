const fs = require('fs');
const https = require('https');

const updateAxiosOptionsForMtls = (axiosOptions, configMtls) => {
    try {
        const key = fs.readFileSync(`./certs/${configMtls.keyPath}`);
        const cert = fs.readFileSync(`./certs/${configMtls.certPath}`);
        const ca = fs.readFileSync(`./certs/${configMtls.caPath}`);

        const httpsAgent = new https.Agent({
            key,
            cert,
            ca
        });

        axiosOptions.httpsAgent = httpsAgent;
    } catch (error) {
        error.source = error.source || 'mtls.js -> updateAxiosOptionsForMtls';
        throw error;
    }
};

module.exports = {
    updateAxiosOptionsForMtls
};