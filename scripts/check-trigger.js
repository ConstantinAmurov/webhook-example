const bbCore = require('./sdk');

const deleteBBCoreData = (data) => {
    delete data.auth_token;
    delete data.bb_app_id;
    delete data.company_id;
    delete data.script;
    return data;
}

const getTriggerStatus = (data, callback) => {
    data = deleteBBCoreData(data);
    const isDuplicate = !!bbCore.getTempValue(JSON.stringify(data));
    callback(null, { status: 'success', isDuplicate });
}

const markTrigger = (data, callback) => {
    data = deleteBBCoreData(data);
    bbCore.setTempValue(JSON.stringify(data), true, 20);
    callback(null, { status: 'success' });
}

const isDuplicateTrigger = async (payload) => {
    const app = await bbCore.getApp();
    const { data: { isDuplicate } } = await app.$post('admin_script', { name: 'get-trigger-status' }, payload);

    if (!isDuplicate)
        await app.$put('admin_script', { name: 'mark-trigger' }, payload);

    return isDuplicate;
};

module.exports = {
    getTriggerStatus,
    markTrigger,
    isDuplicateTrigger
};