import Configurator from 'bookingbug-configurator-js';

import template from './jrni-data-webhook.html';
import modelSchema from './model-schema.json';
import formSchema from './form-schema.json';

Configurator.addPage('CustomPages', 'jrni-data-webhook', {
    style: 'tab',
    layout: [
        [
            {
                type: 'bb-jrni-data-webhook-panel',
                width: 12,
                index: 0,
                panel_params: {
                }
            }
        ]
    ]
});

class JrniDataWebhookController {
    constructor(bbAuthorisation, $scope) {
        this.company = bbAuthorisation.getCompany();
        this.$scope = $scope;

        this.schema = modelSchema;
        this.form = formSchema;

        this.initialise();
    }

    async initialise() {
        const app = await this.company.$get('apps', { app_name: 'jrni-data-webhook' });
        const { data } = await app.$get('admin_script', { name: 'get-webhook-config' });

        if (data.errorMessage)
            this.alert = {
                type: 'danger',
                msg: data.errorMessage
            };
        else {
            this.model = { configItems: data.config };

            // It seems there is a bug in angular-schema-form and the first tab content is not displayed... this is the fix (a nasty fix)
            setTimeout(() => {
                const firstTabElements = document.getElementsByClassName('tab-pane index0');
                const firstTabElement = firstTabElements.length > 0 ? firstTabElements[0] : null;
                if (firstTabElement && !firstTabElement.classList.contains('active'))
                    firstTabElement.classList.add('active');
            }, 1000);

            this.initialised = true;
        }
    }

    async saveConfig(form) {
        this.$scope.$broadcast('schemaFormValidate');

        if (form.$valid) {
            const app = await this.company.$get('apps', { app_name: 'jrni-data-webhook' });
            const { data } = await app.$post('admin_script', { name: 'save-webhook-config' }, { config: this.model.configItems });

            if (data.errorMessage)
                this.alert = {
                    type: 'danger',
                    msg: data.errorMessage
                };
            else {
                this.model = { configItems: data.config };
                this.alert = {
                    type: 'success',
                    msg: 'The config has been updated.'
                };
            }
        }
    }
}

const jrniDataWebhookPanel = {
    templateUrl: template.id,
    controller: JrniDataWebhookController,
    controllerAs: '$ctrl',
    scope: true,
    bindings: {
        filter: '<'
    }
};

angular
    .module('BBAdminDashboard', ['schemaForm'])
    .component('bbJrniDataWebhookPanel', jrniDataWebhookPanel);