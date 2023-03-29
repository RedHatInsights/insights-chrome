import React from 'react';
import { TableComposable, Tbody, Th, Thead, Tr } from '@patternfly/react-table';
import { ChromeUser } from '@redhat-cloud-services/types';

export interface DebuggerTableProps {
  user: ChromeUser;
  selected: string;
}

const DebuggerTable = (props: DebuggerTableProps) => {
  let table;
  const entitlements = Object.entries(props.user.entitlements).reduce(
    (acc, [key, entitlement]) => ({
      ...acc,
      [`entitlements_${key}`]: entitlement.is_entitled,
      [`entitlements_${key}_trial`]: entitlement.is_trial,
    }),
    {}
  );
  const [permissions, setPermissions] = React.useState({});
  React.useEffect(() => {
    async function getPermissions() {
      const userPermissions = await window.insights.chrome.getUserPermissions();
      const userPermissionsList = Object.entries(userPermissions).reduce(
        (acc, [key, userPermission]) => ({
          ...acc,
          [`userPermissionsList_${key}`]: userPermission.permission,
        }),
        {}
      );
      setPermissions(userPermissionsList);
    }
    getPermissions();
  }, []);

  if (props.selected === 'Entitlements') {
    table = (
      <TableComposable variant="compact">
        <Thead>
          <Tr>
            <Th>Entitlements given to {props.user.identity.user?.username}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.entries(entitlements).map((val, index) => {
            //remove entitlement if false
            if (val[1] === true) {
              return (
                <tr key={index}>
                  <td>{val[0].replace(/entitlements_/g, '')}</td>
                </tr>
              );
            } else {
              return null;
            }
          })}
        </Tbody>
      </TableComposable>
    );
  } else if (props.selected === 'Roles') {
    table = (
      <TableComposable variant="compact">
        <Thead>
          <Tr>
            <Th>Roles given to {props.user.identity.user?.username}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.values(permissions).map((val, index) => {
            return (
              <tr key={index}>
                <td>{val}</td>
              </tr>
            );
          })}
        </Tbody>
      </TableComposable>
    );
  }
  return <React.Fragment>{table}</React.Fragment>;
};

export default DebuggerTable;
