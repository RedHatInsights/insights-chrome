import BuildWorkspaceTree from './WorskpaceTreeBuilder';
import Workspace from './Workspace';
import WorkspaceType from './WorkspaceType';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';

/**
 * Asserts that the given tree view item has been properly built with the given
 * workspace.
 * @param treeItem the built tree item.
 * @param workspace the original workspace item the tree item was built from.
 */
function assertTreeViewItemProperlyBuilt(treeItem: TreeViewWorkspaceItem | undefined, workspace: Workspace) {
  expect(treeItem).toBeDefined();

  expect(treeItem?.id).toBe(workspace.id);
  expect(treeItem?.name).toBe(workspace.name);
  expect(treeItem?.workspace).toBe(workspace);
}

/**
 * Helper function which makes it easy to test that a children of a
 * "TreeViewWorkspaceItem" has been properly built with the given workspace.
 * @param treeItem the built tree item.
 * @param workspace the original workspace item the tree item was built from.
 */
function assertChildTreeViewItemProperlyBuilt(treeItem: TreeViewDataItem, workspace: Workspace) {
  if (!instanceOfTreeViewWorkspaceItem(treeItem)) {
    fail(`The given workspace "${treeItem}" is not of the expected "TreeViewWorkspaceItem" type.`);
  }

  assertTreeViewItemProperlyBuilt(treeItem, workspace);
}

describe('The workspace tree builder', () => {
  it('Should return "undefined" when given an empty array', () => {
    // Call the function under test and assert that no workspace was returned.
    expect(BuildWorkspaceTree([])).toBeUndefined();
  });

  it('Should return "undefined" when no root workspace is found in the given array', () => {
    const wps: Workspace[] = [
      {
        id: '78be790c-0e4a-11f0-bd94-083a885cd988',
        name: 'Standard workspace',
        parent_id: '3d0dcd31-08d6-11f0-9912-083a885cd988',
        type: WorkspaceType.STANDARD,
      },
    ];

    // Call the function under test and assert that no workspace was returned.
    expect(BuildWorkspaceTree(wps)).toBeUndefined();
  });

  it('Should return a single root workspace when only one root workspace is given', () => {
    const wps: Workspace[] = [
      {
        id: '55bbf88a-08d5-11f0-9d46-083a885cd988',
        name: 'Root workspace',
        type: WorkspaceType.ROOT,
      },
    ];

    // Call the function under test.
    const rootWorkspace = BuildWorkspaceTree(wps);

    // Assert that the root workspace got correctly wrapped up and identified.
    assertTreeViewItemProperlyBuilt(rootWorkspace, wps[0]);
    expect(rootWorkspace?.children).toBeUndefined();
  });

  it('Should properly build a tree from a given list of workspaces', () => {
    const wps: Workspace[] = [
      {
        id: '55bbf88a-08d5-11f0-9d46-083a885cd988',
        name: 'Root workspace',
        type: WorkspaceType.ROOT,
      },
      {
        id: '9a5e40b8-0e4a-11f0-b833-083a885cd988',
        parent_id: '55bbf88a-08d5-11f0-9d46-083a885cd988', // root workspace.
        name: 'Default workspace',
        type: WorkspaceType.DEFAULT,
      },
      {
        id: '98eb2a4b-0e54-11f0-ae14-083a885cd988',
        parent_id: '55bbf88a-08d5-11f0-9d46-083a885cd988', // root workspace.
        name: 'Workspace A',
        type: WorkspaceType.STANDARD,
      },
      {
        id: 'c94d7a4d-0e4a-11f0-9fb2-083a885cd988',
        parent_id: '55bbf88a-08d5-11f0-9d46-083a885cd988', // root workspace.
        name: 'Workspace B',
        type: WorkspaceType.STANDARD,
      },
      {
        id: 'b53f195a-0e4a-11f0-a121-083a885cd988',
        parent_id: '55bbf88a-08d5-11f0-9d46-083a885cd988', // root workspace.
        name: 'Workspace C',
        type: WorkspaceType.STANDARD,
      },
      {
        id: 'e375a082-0e4a-11f0-8659-083a885cd988',
        parent_id: 'c94d7a4d-0e4a-11f0-9fb2-083a885cd988', // workspace "B".
        name: 'Workspace D',
        type: WorkspaceType.STANDARD,
      },
      {
        id: 'fb7068ca-0e4a-11f0-bcd2-083a885cd988',
        parent_id: 'b53f195a-0e4a-11f0-a121-083a885cd988', // workspace "C".
        name: 'Workspace E',
        type: WorkspaceType.STANDARD,
      },
      {
        id: '23cfd8cc-0e4b-11f0-9fac-083a885cd988',
        parent_id: 'fb7068ca-0e4a-11f0-bcd2-083a885cd988', // workspace "E".
        name: 'Workspace F',
        type: WorkspaceType.STANDARD,
      },
      {
        id: '322b2536-0e4b-11f0-95a7-083a885cd988',
        parent_id: 'fb7068ca-0e4a-11f0-bcd2-083a885cd988', // workspace "E".
        name: 'Workspace G',
        type: WorkspaceType.STANDARD,
      },
      {
        id: '3f4c7a69-0e4b-11f0-a12b-083a885cd988',
        parent_id: 'fb7068ca-0e4a-11f0-bcd2-083a885cd988', // workspace "E".
        name: 'Workspace H',
        type: WorkspaceType.STANDARD,
      },
      {
        id: '4415e6ec-0e4b-11f0-921f-083a885cd988',
        parent_id: '322b2536-0e4b-11f0-95a7-083a885cd988', // workspace "G".
        name: 'Workspace I',
        type: WorkspaceType.STANDARD,
      },
      {
        id: '6719f0ca-0e4b-11f0-8077-083a885cd988',
        parent_id: '4415e6ec-0e4b-11f0-921f-083a885cd988', // workspace "I".
        name: 'Workspace J',
        type: WorkspaceType.STANDARD,
      },
      {
        id: '7060f479-0e4b-11f0-a484-083a885cd988',
        parent_id: '6719f0ca-0e4b-11f0-8077-083a885cd988', // workspace "J".
        name: 'Workspace K',
        type: WorkspaceType.STANDARD,
      },
    ];

    // Call the function under test.
    const rootWorkspace = BuildWorkspaceTree(wps);

    // Assert that the root workspace got correctly wrapped up and identified.
    assertTreeViewItemProperlyBuilt(rootWorkspace, wps[0]);
    expect(rootWorkspace?.children).toBeDefined();

    // The "Default", "A", "B" and "C" workspaces should be children of the
    // root workspace.
    expect(rootWorkspace?.children?.length).toBe(4);

    if (!rootWorkspace?.children) {
      fail('The root workspace does not contain any children and it should contain 4.');
    }

    assertChildTreeViewItemProperlyBuilt(rootWorkspace.children[0], wps[1]); // "Default" workspace.
    assertChildTreeViewItemProperlyBuilt(rootWorkspace.children[1], wps[2]); // workspace "A".
    assertChildTreeViewItemProperlyBuilt(rootWorkspace.children[2], wps[3]); // workspace "B".
    assertChildTreeViewItemProperlyBuilt(rootWorkspace.children[3], wps[4]); // workspace "C".

    // Get the "workspace B" subtree.
    const workspaceB = rootWorkspace.children[2];
    if (!instanceOfTreeViewWorkspaceItem(workspaceB)) {
      fail(`The workspace "${workspaceB}" is not of the expected "TreeViewWorkspaceItem" type.`);
    }

    // The workspace "B" should only contain a single child.
    expect(workspaceB?.children?.length).toBe(1);

    if (!workspaceB?.children) {
      fail('The workspace "B" does not contain any children and it should contain 1.');
    }

    assertChildTreeViewItemProperlyBuilt(workspaceB.children[0], wps[5]); // workspace "D";

    // Get the "workspace C" subtree.
    const workspaceC = rootWorkspace.children[3];
    if (!instanceOfTreeViewWorkspaceItem(workspaceC)) {
      fail(`The workspace "${workspaceC}" is not of the expected "TreeViewWorkspaceItem" type.`);
    }

    // The workspace "C" should contain the workspace "E" as its child.
    expect(workspaceC?.children?.length).toBe(1);

    if (!workspaceC?.children) {
      fail('The workspace "C" does not contain any children and it should contain 1.');
    }

    assertChildTreeViewItemProperlyBuilt(workspaceC.children[0], wps[6]); // workspace "E";

    // Get the "workspace E" subtree.
    const workspaceE = workspaceC.children[0];
    if (!instanceOfTreeViewWorkspaceItem(workspaceE)) {
      fail(`The workspace "${workspaceE}" is not of the expected "TreeViewWorkspaceItem" type.`);
    }

    // The workspace "E" should contain the workspaces "F", "G" and "H" as its
    // children.
    expect(workspaceE?.children?.length).toBe(3);

    if (!workspaceE?.children) {
      fail('The workspace "E" does not contain any children and it should contain 3.');
    }

    assertChildTreeViewItemProperlyBuilt(workspaceE.children[0], wps[7]); // workspace "F";
    assertChildTreeViewItemProperlyBuilt(workspaceE.children[1], wps[8]); // workspace "G";
    assertChildTreeViewItemProperlyBuilt(workspaceE.children[2], wps[9]); // workspace "H";

    // Get the "workspace G" subtree.
    const workspaceG = workspaceE.children[1];
    if (!instanceOfTreeViewWorkspaceItem(workspaceG)) {
      fail(`The workspace "${workspaceG}" is not of the expected "TreeViewWorkspaceItem" type.`);
    }

    // The workspace "G" should only contain the workspace "I" as its only
    // child.
    expect(workspaceG?.children?.length).toBe(1);

    if (!workspaceG?.children) {
      fail('The workspace "G" does not contain any children and it should contain 1.');
    }

    assertChildTreeViewItemProperlyBuilt(workspaceG.children[0], wps[10]); // workspace "I";

    // Get the "workspace I" subtree.
    const workspaceI = workspaceG.children[0];
    if (!instanceOfTreeViewWorkspaceItem(workspaceI)) {
      fail(`The workspace "${workspaceI}" is not of the expected "TreeViewWorkspaceItem" type.`);
    }

    // The workspace "I" should only contain the workspace "J" as its only
    // child.
    expect(workspaceI?.children?.length).toBe(1);

    if (!workspaceI?.children) {
      fail('The workspace "I" does not contain any children and it should contain 1.');
    }

    assertChildTreeViewItemProperlyBuilt(workspaceI.children[0], wps[11]); // workspace "J";

    // Get the "workspace J" subtree.
    const workspaceJ = workspaceI.children[0];
    if (!instanceOfTreeViewWorkspaceItem(workspaceJ)) {
      fail(`The workspace "${workspaceJ}" is not of the expected "TreeViewWorkspaceItem" type.`);
    }

    // The workspace "J" should only contain the workspace "K" as its only
    // child.
    expect(workspaceJ?.children?.length).toBe(1);

    if (!workspaceJ?.children) {
      fail('The workspace "J" does not contain any children and it should contain 1.');
    }

    assertChildTreeViewItemProperlyBuilt(workspaceJ.children[0], wps[12]); // workspace "K";
  });
});
