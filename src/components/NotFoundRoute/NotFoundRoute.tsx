import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { useSetAtom } from 'jotai';

import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';

import { useLoadModule, useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { virtualAssistantShowAssistantAtom } from '../../state/atoms/virtualAssistantAtom';

export type ModelsType = {
  VA: string;
};

type VirtualAssistantState = {
  isOpen: boolean;
  currentModel?: string;
  message?: string;
};

const NotFoundVAButton = () => {
  const setShowAssistant = useSetAtom(virtualAssistantShowAssistantAtom);
  const { hookResult: useVirtualAssistant, loading } = useRemoteHook<[VirtualAssistantState, Dispatch<SetStateAction<VirtualAssistantState>>]>({
    scope: 'virtualAssistant',
    module: './state/globalState',
    importName: 'useVirtualAssistant',
  });

  // Extract setState from the hook result
  const [module] = useLoadModule(
    {
      scope: 'virtualAssistant',
      module: './state/globalState',
      importName: 'Models',
    },
    {}
  );

  const Models = module as ModelsType;
  const [, setState] = useVirtualAssistant || [null, null];

  useEffect(() => {
    setShowAssistant(true);
  }, [setShowAssistant]);

  return (
    <Button
      onClick={() => {
        setState?.({
          isOpen: true,
          currentModel: Models.VA,
          message: 'Contact my org admin.',
        });
      }}
      className="pf-v6-c-button pf-m-link"
      isDisabled={loading || !setState || !Models}
    >
      Contact your org admin with the Virtual Assistant.
    </Button>
  );
};

const NotFoundRoute = () => {
  const isVAEnabled = useFlag('platform.va.environment.enabled');

  return (
    <EmptyState id="not-found">
      <EmptyStateBody>
        <InvalidObject />
        {isVAEnabled && <NotFoundVAButton />}
      </EmptyStateBody>
    </EmptyState>
  );
};
export default NotFoundRoute;
