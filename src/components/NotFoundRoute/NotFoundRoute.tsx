import React, { useEffect } from 'react';
import { useSetAtom } from 'jotai';

import { Button } from '@patternfly/react-core';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';

import useVirtualAssistant from '../../hooks/useVirtualAssistant';
import { virtualAssistantShowAssistantAtom } from '../../state/atoms/virtualAssistantAtom';

const NotFoundRoute = () => {
  const setShowAssistant = useSetAtom(virtualAssistantShowAssistantAtom);
  const { openVA } = useVirtualAssistant();

  useEffect(() => {
    setShowAssistant(true);
  }, [setShowAssistant]);

  return <EmptyState id="not-found">
    <EmptyStateBody>
      <InvalidObject />
      <Button 
        onClick={() => {openVA(`Contact my org admin.`)}} 
        className="pf-v6-c-button pf-m-link"
      >
        Contact your org admin with the Virtual Assistant.
      </Button>
    </EmptyStateBody>
  </EmptyState>
};
export default NotFoundRoute;
