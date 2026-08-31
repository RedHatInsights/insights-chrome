import React, { Fragment, useCallback } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { useSetAtom } from 'jotai';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import SilentErrorBoundary from '../Routes/SilentErrorBoundary';
import { SelectedWorkspace, selectedWorkspaceAtom } from '../../state/atoms/workspaceSelectorAtom';

const WorkspaceSelector = () => {
  const isWorkspaceSelectorEnabled = useFlag('platform.chrome.workspace-global_selector');
  const setSelectedWorkspace = useSetAtom(selectedWorkspaceAtom);

  const onSelect = useCallback(
    (workspace: { id?: string; name?: string }) => {
      if (workspace.id && workspace.name) {
        setSelectedWorkspace({ id: workspace.id, name: workspace.name } satisfies SelectedWorkspace);
      }
    },
    [setSelectedWorkspace]
  );

  if (!isWorkspaceSelectorEnabled) {
    return null;
  }

  const workspaceSelectorProps: ScalprumComponentProps = {
    scope: 'rbac',
    module: './modules/WorkspaceSelector',
    fallback: <Skeleton width="200px" screenreaderText="Loading workspace selector" />,
    ErrorComponent: <Fragment />,
    onSelect,
    menuWidth: 'max-content',
  };

  return (
    <SilentErrorBoundary>
      <div className="pf-v6-u-display-flex pf-v6-u-align-items-center" data-testid="workspace-selector">
        <ScalprumComponent {...workspaceSelectorProps} />
      </div>
    </SilentErrorBoundary>
  );
};

export default WorkspaceSelector;
