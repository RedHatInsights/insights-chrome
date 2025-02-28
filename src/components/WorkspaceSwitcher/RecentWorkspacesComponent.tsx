import { Badge } from '@patternfly/react-core/dist/dynamic/components/Badge';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import AngleRightIcon from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';
import breadcrumbStyles from '@patternfly/react-styles/css/components/Breadcrumb/breadcrumb';
import * as React from 'react';
import RecentlyUsedWorkspace from './RecentlyUsedWorkspace';
import WorkspaceType from './WorkspaceType';

/**
 * Defines the properties for the RecentWorkspacesComponent.
 */
interface RecentWorkspacesComponentProps {
  recentlyUsedWorkspaces: RecentlyUsedWorkspace[];
}

/**
 * Defines the properties for the conditional breadcrumb component.
 */
interface ConditionalBreadcrumbProps {
  workspacePath: string[];
  workspaceType: WorkspaceType;
}

/**
 * A component that shows a list of the most recently used workspaces and the
 * workspace tree's path to them.
 * @param param0 the recently used workspaces.
 * @returns a list of recently the recently used workspaces which also have
 * a breadcrumbs path to the workspaces themselves, unless the workspace is the
 * root workspace.
 */
const RecentWorkspacesComponent = ({ recentlyUsedWorkspaces }: RecentWorkspacesComponentProps) => {
  return (
    <List isPlain>
      {recentlyUsedWorkspaces.map((recentlyUsedWorkspace) => {
        return (
          <ListItem key={recentlyUsedWorkspace.workspace.id}>
            <h1>{recentlyUsedWorkspace.workspace.name}</h1>
            <CustomBreadcrumb workspacePath={recentlyUsedWorkspace.workspacePath} workspaceType={recentlyUsedWorkspace.workspace.type} />
          </ListItem>
        );
      })}
    </List>
  );
};

/**
 * A custom conditional breadcrumb.
 * @param param0 the component's parameters.
 * @returns nothing if the workspace is a root workspace, a regular breadcrumb
 * for when there are less than four items in the path, and when there are more
 * than four items in the path a breadcrumb with just the first and the last
 * element of the path, and a badge with a tooltip with the rest of the
 * elements in the middle.
 */
const CustomBreadcrumb = ({ workspacePath, workspaceType }: ConditionalBreadcrumbProps) => {
  if (workspaceType === WorkspaceType.ROOT && workspacePath.length === 1) {
    return null;
  }

  if (workspacePath.length < 4) {
    // Shwoing three elements is completely fine.
    return (
      <Breadcrumb>
        {workspacePath.map((pathElement: string) => {
          return <BreadcrumbItem key={crypto.randomUUID()}>{pathElement}</BreadcrumbItem>;
        })}
      </Breadcrumb>
    );
  } else {
    // Make a copy of the original array so that we don't make unexpected changes
    // to it.
    const path: string[] = workspacePath.slice();

    // Grab the first and last elements of the breadcrumb to manually place
    // them.
    const firstElement = path.shift();
    const lastElement = path.pop();

    // Generate the middle elements that will be used for the badge and the
    // tooltip.
    const middleElements = [];
    for (let i = 0; i < path.length; i++) {
      if (i == path.length - 1) {
        middleElements.push(path[i]);
      } else {
        middleElements.push(`${path[i]} > `);
      }
    }

    // The tooltip will contain the breadcrumbs with their little angle icon
    // unless it's the last element of the list.
    const tooltipContent: React.ReactNode = (
      <div>
        {path.map((element: string, i: number) => {
          if (i === path.length - 1) {
            return element;
          } else {
            return (
              <>
                {element}
                <span className={breadcrumbStyles.breadcrumbItemDivider}>
                  <AngleRightIcon />
                </span>
              </>
            );
          }
        })}
      </div>
    );

    return (
      <Breadcrumb>
        <BreadcrumbItem key={crypto.randomUUID()}>{firstElement}</BreadcrumbItem>
        <BreadcrumbItem>
          <Tooltip content={tooltipContent}>
            <Badge isRead>{path.length}</Badge>
          </Tooltip>
        </BreadcrumbItem>
        <BreadcrumbItem key={crypto.randomUUID()}>{lastElement}</BreadcrumbItem>
      </Breadcrumb>
    );
  }
};

export default RecentWorkspacesComponent;
