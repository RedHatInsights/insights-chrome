import React from 'react';
import setDependencies from '../externalDependencies';
import Deferred from '@redhat-cloud-services/frontend-components-utilities/files/Deffered';

export default async function loadRemediation (dependencies) {
    setDependencies(dependencies);

    await import(/* webpackChunkName: "remediation-styles" */ './remediationsStyles');
    const remediationsData = await import(/* webpackChunkName: "remediations" */ '@redhat-cloud-services/frontend-components-remediations');
    const RenderWrapper = await import(/* webpackChunkName: "remediations-render-wrapper" */ './Wrapper');
    const deferred = new Deferred();
    return {
        ...remediationsData,
        openWizard: async (data, basePath) => {
            const wizardRef = await deferred.promise;
            remediationsData.openWizard(data, basePath, wizardRef);
        },
        // eslint-disable-next-line react/display-name
        RemediationWizard: () => {
            return <RenderWrapper.default
                cmp={remediationsData.RemediationWizard}
                onAppRender={(wizardRef) => {
                    console.log(wizardRef);
                    deferred.resolve(wizardRef);
                }}
            />;
        }
    };
}
