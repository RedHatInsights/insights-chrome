import * as React from 'react';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import TreeViewWorkspaceItem from './TreeViewWorkspaceItem';

/**
 * Defines the expected props for the WorkspaceMenuToggle component.
 */
interface WorkspaceMenuToggleProps {
  menuToggleRef: React.LegacyRef<MenuToggleElement> | undefined;
  onMenuToggleClick: React.MouseEventHandler<MenuToggleElement>;
  isMenuToggleExpanded: boolean;
  selectedWorkspace: TreeViewWorkspaceItem;
}

/**
 * Defines the WorkspaceMenuToggle component, which shows a default message
 * when the selected workspace is undefined.
 */
const WorkspaceMenuToggle = ({ menuToggleRef, onMenuToggleClick, isMenuToggleExpanded, selectedWorkspace }: WorkspaceMenuToggleProps) => {
  let content = 'Select a workspace';

  if (selectedWorkspace) {
    content = selectedWorkspace.workspace.name;
  }

  return (
    <MenuToggle ref={menuToggleRef} onClick={onMenuToggleClick} isExpanded={isMenuToggleExpanded}>
      {content}
    </MenuToggle>
  );
};

export default WorkspaceMenuToggle;
