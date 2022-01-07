const { updateAxiosOptionsForBasicUserPass } = require('./basic');

const updateAxiosOptionsForAuth = (axiosOptions, configAuth) => {
    switch (configAuth.method) {
        case 'basic_user_pass':
            updateAxiosOptionsForBasicUserPass(axiosOptions, configAuth);
            break;

        case 'basic_token':
            // updateAxiosOptionsForBasicToken(axiosOptions, configAuth);
            break;

        case 'oauth2_client_credentials':
            // updateAxiosOptionsForOauth2ClientCredentials(axiosOptions, configAuth);
            break;
    }
};

module.exports = {
    updateAxiosOptionsForAuth
};