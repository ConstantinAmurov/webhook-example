const { raygun } = require('../../dependencies');
const crypto = require('crypto');

/**
 * Possible options:
 *     - apiKey (string, required)
 *     - error (Error object, required)
 *         - source (string, optional)
 *     - env (string, optional)
 *     - customData (object, optional)
 *     - groupingKeyBase (string, optional)
 *     - failureCallback ((err) => {}, optional)
 *
 * Depending on the above properties, the Raygun error will have the following format: "[ENV][ERROR_SOURCE] ERROR_MESSAGE".
 */

const sendToRaygun = options => {
    let { apiKey, error, env, customData, groupingKeyBase, failureCallback } = options;
    const errorMessage = error.message;

    if (!apiKey || !error)
        return;

    try {
        const raygunClientOptions = { apiKey };
        if (groupingKeyBase)
            raygunClientOptions.groupingKey = () => crypto.createHash('md5').update(groupingKeyBase).digest('hex');

        const raygunClient = new raygun.Client().init(raygunClientOptions);

        let raygunError = '';
        if (env)
            raygunError += `[${env}]`;
        if (error.source)
            raygunError += `[${error.source}]`;
        raygunError += `${raygunError ? ' ' : ''}${error.message}`;

        error.message = raygunError;
        customData = customData || {};

        raygunClient.send(error, customData);

        error.message = errorMessage;
    } catch (err) {
        if (failureCallback)
            failureCallback(err);
        else
            console.error('sendToRaygun failed', err);
    }
}

module.exports = sendToRaygun;