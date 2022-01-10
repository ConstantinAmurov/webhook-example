const { axios } = require('../../dependencies');
const bbCore = require('../../sdk');

const setConfigAuthDefaultValues = (configAuth) => {
    configAuth.clientAuthentication = configAuth.clientAuthentication || 'send_as_basic_auth_header';
    configAuth.responseProps = configAuth.responseProps || {};
    configAuth.responseProps.accessToken = configAuth.responseProps.accessToken || 'access_token';
    configAuth.responseProps.expiresIn = configAuth.responseProps.expiresIn || 'expires_in';
    configAuth.headerPrefix = configAuth.headerPrefix || 'Bearer ';
};

const isValidToken = token => {
    if (!token)
        return false;

    const { accessToken, expiresIn, generatedAt } = token;

    if (!accessToken || !expiresIn || !generatedAt)
        return false;

    const tokenAge = bbCore.moment().diff(generatedAt, 'seconds');
    const remainingLife = expiresIn - tokenAge;

    if (remainingLife < 1 / 6 * expiresIn)
        return false;

    return true;
};

const getAccessToken = async (configAuth) => {
    try {
        const { tempVarUniqueName, accessTokenUrl, clientId, clientSecret, clientAuthentication, responseProps } = configAuth;

        const currentToken = JSON.parse(bbCore.getTempValue(tempVarUniqueName));
        if (isValidToken(currentToken))
            return currentToken.accessToken;

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const data = {
            grant_type: 'client_credentials'
        };
        switch (clientAuthentication) {
            case 'send_as_basic_auth_header':
                headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
                break;

            case 'send_client_credentials_in_body':
                data['client_id'] = clientId;
                data['client_secret'] = clientSecret;
                break;
        }

        const result = await axios({
            method: 'post',
            url: accessTokenUrl,
            headers,
            data: (new URLSearchParams(data)).toString()
        });
        const { data: { [responseProps.accessToken]: accessToken, [responseProps.expiresIn]: expiresIn } } = result;

        if (!accessToken || !expiresIn)
            throw new Error('Wrong values for auth.responseProps. Please check the config.');

        const newToken = {
            accessToken,
            expiresIn,
            generatedAt: Date.now()
        };

        bbCore.setTempValue(tempVarUniqueName, JSON.stringify(newToken), expiresIn);

        return newToken.accessToken;
    } catch (error) {
        error.source = error.source || 'oauth2.js -> getAccessToken';
        throw error;
    }
};

const updateAxiosOptionsForOauth2ClientCredentials = async (axiosOptions, configAuth) => {
    try {
        setConfigAuthDefaultValues(configAuth);
        const accessToken = await getAccessToken(configAuth);
        axiosOptions.headers.Authorization = `${configAuth.headerPrefix} ${accessToken}`;
    } catch (error) {
        error.source = error.source || 'oauth2.js -> updateAxiosOptionsForOauth2ClientCredentials';
        throw error;
    }
};

module.exports = {
    updateAxiosOptionsForOauth2ClientCredentials
};