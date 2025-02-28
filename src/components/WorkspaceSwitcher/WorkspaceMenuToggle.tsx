import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import * as React from 'react';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';

/**
 * Defines the expected props for the WorkspaceMenuToggle component.
 */
interface WorkspaceMenuToggleProps {
  menuToggleRef: React.LegacyRef<MenuToggleElement> | undefined;
  onMenuToggleClick: React.MouseEventHandler<MenuToggleElement>;
  isDisabled: boolean;
  isMenuToggleExpanded: boolean;
  selectedWorkspace: TreeViewWorkspaceItem | undefined;
}

/**
 * Defines the WorkspaceMenuToggle component, which shows a default message
 * when the selected workspace is undefined.
 */
const WorkspaceMenuToggle = ({ menuToggleRef, onMenuToggleClick, isMenuToggleExpanded, isDisabled, selectedWorkspace }: WorkspaceMenuToggleProps) => {
  let content = '';
  if (isDisabled) {
    content = 'Loading workspaces...';
  } else if (selectedWorkspace) {
    content = selectedWorkspace.workspace.name;
  } else {
    content = 'Select a workspace';
  }

  return (
    <MenuToggle ref={menuToggleRef} onClick={onMenuToggleClick} isDisabled={isDisabled} isExpanded={isMenuToggleExpanded}>
      {content}
    </MenuToggle>
  );
};

export default WorkspaceMenuToggle;
