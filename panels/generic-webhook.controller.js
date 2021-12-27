import Configurator from 'bookingbug-configurator-js';

import template from './generic-webhook.html';

Configurator.addPage('CustomPages', 'generic-webhook', {
    style: 'tab',
    layout: [
        [
            {
                type: 'bb-generic-webhook-panel',
                width: 12,
                index: 0,
                panel_params: {
                }
            }
        ]
    ]
});

class GenericWebhookController {
    constructor(bbAuthorisation) {
        this.company = bbAuthorisation.getCompany();
        this.initialise();
    }

    async initialise() {
        const app = await this.company.$get('apps', { app_name: 'generic-webhook' });
        const { data } = await app.$get('admin_script', { name: 'get-webhook-config' });

        if (data.errorMessage)
            this.alert = {
                type: 'danger',
                msg: data.errorMessage
            };
        else {
            this.configJson = JSON.stringify(data.config, null, 4);
            this.configFieldIsValid = true;
            this.initialised = true;
        }
    }

    validateConfigField() {
        try {
            JSON.parse(this.configJson);
            this.configFieldIsValid = true;
        } catch (error) {
            this.configFieldIsValid = false;
        }
    }

    async saveConfig() {
        const app = await this.company.$get('apps', { app_name: 'generic-webhook' });
        const { data } = await app.$post('admin_script', { name: 'save-webhook-config' }, { configJson: this.configJson });

        if (data.errorMessage)
            this.alert = {
                type: 'danger',
                msg: data.errorMessage
            };
        else {
            this.configJson = JSON.stringify(data.config, null, 4);
            this.alert = {
                type: 'success',
                msg: 'The config has been updated.'
            };
        }
    }
}

const genericWebhookPanel = {
    templateUrl: template.id,
    controller: GenericWebhookController,
    controllerAs: '$ctrl',
    scope: true,
    bindings: {
        filter: '<'
    }
};

angular
    .module('BBAdminDashboard')
    .component('bbGenericWebhookPanel', genericWebhookPanel);