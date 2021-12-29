const log = require('./utils/logger');
const { isDuplicateTrigger } = require('./check-trigger');

const afterCreateBooking = (data, callback) => {
    log('info', '[afterCreateBooking] data', data);
    callback(null, {});
};

const afterUpdateBooking = async (data, callback) => {
    // There is some weird caching issue sometimes so make sure we have the right data
    const booking = await data.booking.$get('self', { no_cache: true });

    // Detect if it is duplicate trigger (the issue related to multiple triggers for a single update)
    const duplicateCheckPayload = {
        id: booking.id,
        company_id: booking.company_id,
        datetime: booking.datetime,
        person_id: booking.person_id,
        current_multi_status: booking.current_multi_status ? booking.current_multi_status : 'confirmed'
    };

    if (await isDuplicateTrigger(duplicateCheckPayload)) {
        log('warn', '[afterUpdateBooking] DUPLICATE TRIGGER, execution aborted', '', true);
        callback(null, {});
        return;
    }

    log('info', '[afterUpdateBooking] Continue the execution', '', true);
    log('info', '[afterUpdateBooking] booking', booking);
    callback(null, {});
};

const afterDeleteBooking = (data, callback) => {
    log('info', '[afterDeleteBooking] data', data);
    callback(null, {});
};

module.exports = {
    afterCreateBooking,
    afterUpdateBooking,
    afterDeleteBooking
};