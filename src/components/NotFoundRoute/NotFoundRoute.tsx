import React from 'react';
import { useAtom } from 'jotai';

import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';

import { virtualAssistantOpenAtom, virtualAssistantStartInputAtom } from '../../state/atoms/virtualAssistantAtom';

const NotFoundRoute = () => {
  const [isOpen, setOpen] = useAtom(virtualAssistantOpenAtom);
  const [startInput, setStartInput] = useAtom(virtualAssistantStartInputAtom);
  const openVA = () => {
    setStartInput(`Contact my org admin for access to ${window.location.pathname}.`)
    setOpen(true);
  }
  // TODO: make link prettier
  return <EmptyState id="not-found">
    <EmptyStateBody>
      <InvalidObject />
      <a onClick={openVA}>Contact your org admin with the Virtual Assistant</a>
    </EmptyStateBody>
  </EmptyState>
};
export default NotFoundRoute;
