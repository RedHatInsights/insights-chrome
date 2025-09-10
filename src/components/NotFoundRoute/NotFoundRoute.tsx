import React, { useEffect } from 'react';
import { useSetAtom } from 'jotai';

import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';

import useVirtualAssistant from '../../hooks/useVirtualAssistant';
import { virtualAssistantShowAssistantAtom } from '../../state/atoms/virtualAssistantAtom';
import { useFlag } from '@unleash/proxy-client-react';

const NotFoundRoute = () => {
  const setShowAssistant = useSetAtom(virtualAssistantShowAssistantAtom);
  const { openVA } = useVirtualAssistant();
  const isOpenConfig = useFlag('platform.virtual-assistant.is-open-config');

  useEffect(() => {
    setShowAssistant(true);
  }, [setShowAssistant]);

  return (
    <>
      {isOpenConfig ? (
        <EmptyState id="not-found">
          <EmptyStateBody>
            <InvalidObject />
            <Button
              onClick={() => {
                openVA(`Contact my org admin.`);
              }}
              className="pf-v6-c-button pf-m-link"
            >
              Contact your org admin with the Virtual Assistant.
            </Button>
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <EmptyState id="not-found">
          <EmptyStateBody>
            <InvalidObject />
          </EmptyStateBody>
        </EmptyState>
      )}
    </>
  );
};
export default NotFoundRoute;
