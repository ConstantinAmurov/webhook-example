const bbCore = require('../sdk');
const { axios } = require('../dependencies');

const getStaffGroupId = async (booking) => {
    const url = `${bbCore.context.apiUrl}/api/${bbCore.context.apiVersion}/admin/${booking.company_id}/people/${booking.person_id}`;
    const axiosOptions = {
        method: 'get',
        url,
        headers: {
            'Accept': 'application/json',
            'App-Id': bbCore.sessionStorage.app_id,
            'App-Key': bbCore.sessionStorage.app_key,
            'Auth-Token': bbCore.sessionStorage.auth_token
        }
    };

    const { data } = await axios(axiosOptions);

    return data.group_id;
};

const getCompaniesChildrenIds = async (parentCompanyIds) => {
    try {
        const requests = parentCompanyIds.map((parentCompanyId) => getCompanyChildren(parentCompanyId));
        let childrenCompanies = await Promise.all(requests);
        childrenCompanies = childrenCompanies.flat();

        let childrenCompaniesIds = [];
        populateChildrenCompaniesIds(childrenCompaniesIds, childrenCompanies);

        return childrenCompaniesIds;
    }
    catch (error) {
        error.source = error.source || 'jrni.js -> getCompaniesChildrenIds';
        throw error;
    }
};

const populateChildrenCompaniesIds = (childrenCompaniesIds, childrenCompanies) =>
    childrenCompanies.forEach((company) => {
        childrenCompaniesIds.push(company.id);
        if (company.children_count > 0)
            populateChildrenCompaniesIds(childrenCompaniesIds, company['companies']);
    });

const getCompanyChildren = async (parentCompanyId) => {
    try {
        const url = `${bbCore.context.apiUrl}/api/${bbCore.context.apiVersion}/admin/${parentCompanyId}/company`;
        const axiosOptions = {
            method: 'get',
            url,
            headers: {
                'Accept': 'application/json',
                'App-Id': bbCore.sessionStorage.app_id,
                'App-Key': bbCore.sessionStorage.app_key,
                'Auth-Token': bbCore.sessionStorage.auth_token
            }
        };

        const { data } = await axios(axiosOptions);

        return data.companies;
    }
    catch (error) {
        error.source = error.source || 'jrni.js -> getCompanyChildren';
        throw error;
    }
};

module.exports = {
    getStaffGroupId,
    getCompaniesChildrenIds
};