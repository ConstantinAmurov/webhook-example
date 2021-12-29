const { getWebhookConfig, saveWebhookConfig } = require('./config');
const { afterCreateBooking, afterUpdateBooking, afterDeleteBooking } = require('./bookings');
const { getTriggerStatus, markTrigger } = require('./check-trigger');

module.exports = {
    getWebhookConfig,
    saveWebhookConfig,
    afterCreateBooking,
    afterUpdateBooking,
    afterDeleteBooking,
    getTriggerStatus,
    markTrigger
};