import RecentlyUsedWorkspace from './RecentlyUsedWorkspace';
import FindPathForWorkspaces from './RecentWorkspacesManager';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';
import WorkspaceType from './WorkspaceType';
import buildWorkspaceTree from './WorskpaceTreeBuilder';

// Defines a flat tree of workspaces.
const workspaces: Workspace[] = [
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

// Defines a structured tree of workspaces.
const tree: TreeViewWorkspaceItem | undefined = buildWorkspaceTree(workspaces);

describe('The recent workspaces manager', () => {
  it(`Should return a recently used workspace with no path when the tree's node does not have an ID`, () => {
    // Create a workspace that will be used both for the tree and for the
    // function under test, which will try to find it in the tree.
    const wps: Workspace[] = [
      {
        id: '55bbf88a-08d5-11f0-9d46-083a885cd988',
        name: 'Root workspace',
        parent_id: '3d0dcd31-08d6-11f0-9912-083a885cd988',
        type: WorkspaceType.ROOT,
      },
    ];

    // Create a tree item without an ID set in the tree item itself.
    const invalidTree: TreeViewWorkspaceItem = {
      name: 'Wrongly formatted tree',
      workspace: wps[0],
    };

    // Call the function under test.
    const result: RecentlyUsedWorkspace[] = FindPathForWorkspaces(invalidTree, wps);

    // The workspace should have been wrapped in a "Recently used workspace"
    // nonetheless.
    expect(result.length).toEqual(1);

    // The given workspace should be present in the "recently used workspace"
    // object.
    expect(result[0].workspace).toEqual(wps[0]);

    // There should not be any path elements since the node does not have an
    // id assigned.
    expect(result[0].workspacePath).toHaveLength(0);
  });

  it('Should return a recently used workspace with no path when the given workspace is not found in the tree', () => {
    if (!tree) {
      fail('A tree was not built from the given workspaces.');
    }

    // Define a workspace that is not present in the workspaces' tree.
    const wps: Workspace[] = [
      {
        id: '2d9c685c-0ee8-11f0-8ebf-083a885cd988',
        name: 'Random workspace',
        parent_id: '34f2b9b2-0ee8-11f0-b749-083a885cd988',
        type: WorkspaceType.STANDARD,
      },
    ];

    const result: RecentlyUsedWorkspace[] = FindPathForWorkspaces(tree, wps);

    // The workspace should have been wrapped in a "Recently used workspace"
    // nonetheless.
    expect(result.length).toEqual(1);

    // The given workspace should be present in the "recently used workspace"
    // object.
    expect(result[0].workspace).toEqual(wps[0]);

    // There should not be any path elements since the node does not have an
    // id assigned.
    expect(result[0].workspacePath).toHaveLength(0);
  });

  it('Should receturn a recently used workspace with no path when the given workspace is not found in the tree', () => {
    if (!tree) {
      fail('A tree was not built from the given workspaces.');
    }

    // Define a workspace that is not present in the workspaces' tree.
    const wps: Workspace[] = [
      {
        id: '2d9c685c-0ee8-11f0-8ebf-083a885cd988',
        name: 'Random workspace',
        parent_id: '34f2b9b2-0ee8-11f0-b749-083a885cd988',
        type: WorkspaceType.STANDARD,
      },
    ];

    const result: RecentlyUsedWorkspace[] = FindPathForWorkspaces(tree, wps);

    // The workspace should have been wrapped in a "Recently used workspace"
    // nonetheless.
    expect(result.length).toEqual(1);

    // The given workspace should be present in the "recently used workspace"
    // object.
    expect(result[0].workspace).toEqual(wps[0]);

    // There should not be any path elements since the node does not have an
    // id assigned.
    expect(result[0].workspacePath).toHaveLength(0);
  });

  it('Should return all the provided workspaces along with their paths', () => {
    if (!tree) {
      fail('A tree was not built from the given workspaces.');
    }

    // Call the function under test.
    const recentlyUsedWorkspaces: RecentlyUsedWorkspace[] = FindPathForWorkspaces(tree, workspaces);

    // Define the expected results.
    const expectedResult: RecentlyUsedWorkspace[] = [
      {
        workspace: workspaces[0], // "Root workspace".
        workspacePath: ['Root workspace'],
      },
      {
        workspace: workspaces[1], // "Default workspace".
        workspacePath: ['Root workspace', 'Default workspace'],
      },
      {
        workspace: workspaces[2], // "Workspace A".
        workspacePath: ['Root workspace', 'Workspace A'],
      },

      {
        workspace: workspaces[3], // "Workspace B".
        workspacePath: ['Root workspace', 'Workspace B'],
      },
      {
        workspace: workspaces[4], // "Workspace C".
        workspacePath: ['Root workspace', 'Workspace C'],
      },
      {
        workspace: workspaces[5], // "Workspace D".
        workspacePath: ['Root workspace', 'Workspace B', 'Workspace D'],
      },
      {
        workspace: workspaces[6], // "Workspace E".
        workspacePath: ['Root workspace', 'Workspace C', 'Workspace E'],
      },
      {
        workspace: workspaces[7], // "Workspace F".
        workspacePath: ['Root workspace', 'Workspace C', 'Workspace E', 'Workspace F'],
      },
      {
        workspace: workspaces[8], // "Workspace G".
        workspacePath: ['Root workspace', 'Workspace C', 'Workspace E', 'Workspace G'],
      },
      {
        workspace: workspaces[9], // "Workspace H".
        workspacePath: ['Root workspace', 'Workspace C', 'Workspace E', 'Workspace H'],
      },
      {
        workspace: workspaces[10], // "Workspace I".
        workspacePath: ['Root workspace', 'Workspace C', 'Workspace E', 'Workspace G', 'Workspace I'],
      },
      {
        workspace: workspaces[11], // "Workspace J".
        workspacePath: ['Root workspace', 'Workspace C', 'Workspace E', 'Workspace G', 'Workspace I', 'Workspace J'],
      },
      {
        workspace: workspaces[12], // "Workspace K".
        workspacePath: ['Root workspace', 'Workspace C', 'Workspace E', 'Workspace G', 'Workspace I', 'Workspace J', 'Workspace K'],
      },
    ];

    for (const result of recentlyUsedWorkspaces) {
      const index = expectedResult.findIndex(function (er: RecentlyUsedWorkspace): boolean {
        return er.workspace.id == result.workspace.id;
      });

      if (index == -1) {
        fail(`The generated recently used workspace ${result} was not found in the array of expected results`);
      }

      // Assert that the workspace is the same.
      expect(result.workspace).toBe(expectedResult[index].workspace);

      // Assert that the generated workspace path is the one that we expected.
      expect(result.workspacePath).toEqual(expectedResult[index].workspacePath);
    }
  });
});
