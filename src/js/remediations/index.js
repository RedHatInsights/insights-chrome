import React from 'react';
import Deferred from '@redhat-cloud-services/frontend-components-utilities/Deffered';

export default async function loadRemediation() {
  const RenderWrapper = await import(/* webpackChunkName: "remediations-render-wrapper" */ './Wrapper');
  let deferred = new Deferred();
  return {
    openWizard: async (data, basePath) => {
      deferred.resolve({ data, basePath });
    },
    // eslint-disable-next-line react/display-name
    RemediationWizard: () => (
      <RenderWrapper.default
        promise={deferred.promise}
        onClose={(newDeffered) => {
          deferred = newDeffered;
        }}
      />
    ),
  };
}
