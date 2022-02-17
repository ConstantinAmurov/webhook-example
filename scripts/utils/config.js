const bbCore = require('../sdk');

const CONFIG_PROPERTIES = [
    'configJson',
    'raygunApiKey'
];

const getConfItem = name => {
    if (!CONFIG_PROPERTIES.includes(name))
        return null;

    const configValue = bbCore.getConfigValue(name);
    return configValue === null ? '' : configValue;
};

const getConfItems = names => {
    return names.reduce((items, name) => {
        items[name] = getConfItem(name);
        return items;
    }, {});
};

const getAllConfItems = () => {
    return getConfItems(CONFIG_PROPERTIES);
};

const setConfItem = (name, value) => {
    return bbCore.setConfigValue(name, value);
};

module.exports = {
    CONFIG_PROPERTIES,
    getConfItem,
    getConfItems,
    getAllConfItems,
    setConfItem
};