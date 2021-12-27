const { getWebhookConfig, saveWebhookConfig } = require('./config');
const { afterCreateBooking, afterUpdateBooking, afterDeleteBooking } = require('./bookings');

module.exports = {
    getWebhookConfig,
    saveWebhookConfig,
    afterCreateBooking,
    afterUpdateBooking,
    afterDeleteBooking
};