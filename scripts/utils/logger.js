const { getEnv } = require('./general');

const logTypes = ['info', 'warn', 'error'];

const log = (type, message, data = '', displayOnProd = false) => {
  if (getEnv() == 'prod' && !displayOnProd)
    return;

  type = logTypes.indexOf(type) == -1 ? 'info' : type;
  console[type](`[GENERIC_WEBHOOK]`, message, data);
};

module.exports = log;