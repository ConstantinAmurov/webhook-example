const { updateAxiosOptionsForBasicUserPass, updateAxiosOptionsForBasicToken } = require('./basic');
const { updateAxiosOptionsForOauth2ClientCredentials } = require('./oauth2');

const updateAxiosOptionsForAuth = async (axiosOptions, configAuth) => {
    try {
        switch (configAuth.method) {
            case 'basic_user_pass':
                updateAxiosOptionsForBasicUserPass(axiosOptions, configAuth);
                break;

            case 'basic_token':
                updateAxiosOptionsForBasicToken(axiosOptions, configAuth);
                break;

            case 'oauth2_client_credentials':
                await updateAxiosOptionsForOauth2ClientCredentials(axiosOptions, configAuth);
                break;
        }
    } catch (error) {
        error.source = error.source || 'auth.js -> updateAxiosOptionsForAuth';
        throw error;
    }
};

module.exports = {
    updateAxiosOptionsForAuth
};