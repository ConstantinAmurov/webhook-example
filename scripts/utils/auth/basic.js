const updateAxiosOptionsForBasicUserPass = (axiosOptions, configAuth) => {
    const { username, password } = configAuth;
    const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
    axiosOptions.headers.Authorization = `Basic ${base64Credentials}`;
};

module.exports = {
    updateAxiosOptionsForBasicUserPass
};