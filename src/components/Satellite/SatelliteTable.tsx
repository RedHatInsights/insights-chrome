import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TableComposable, TableText, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core';

interface Registration {
  uid: string;
  display_name: string;
  created_at: string;
  singleAction: string;
}

const SatelliteTable: React.FC = () => {
  const [registrations, setRegistrations] = useState([]);
  const [ready, setReady] = useState(false);
  const columnNames = {
    display_name: 'Name',
    created_at: 'Created At',
    singleAction: 'Single action',
  };

  const getRegistrations = () => {
    axios
      .get('/api/identity/certificate/registrations')
      .then((res) => {
        setRegistrations(
          res.data.registrations.map((ele: Registration) => {
            return { ...ele, singleAction: 'unregister' };
          })
        );
        setReady(true);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const unregisterSystem = (uid: string) => {
    axios
      .delete(`/api/identity/certificate/registrations/${uid}`)
      .then((res) => {
        console.log(res.data);
        getRegistrations();
      })
      .catch((error) => {
        console.log(error);
      });
  };
  useEffect(() => {
    if (!ready) {
      getRegistrations();
    }
  }, [ready]);
  if (registrations?.length < 1) {
    return <EmptyState>There are no registrations</EmptyState>;
  }
  return (
    <TableComposable aria-label="Misc table">
      <Thead noWrap>
        <Tr>
          <Th>{columnNames.display_name}</Th>
          <Th>{columnNames.created_at}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {registrations?.map((reg: Registration) => {
          const unregisterButton = (
            <TableText>
              <Button variant="secondary" onClick={() => unregisterSystem(reg.uid)}>
                {reg.singleAction}
              </Button>
            </TableText>
          );
          return (
            <Tr key={reg.uid}>
              <Td dataLabel={columnNames.display_name}>{reg.display_name}</Td>
              <Td dataLabel={columnNames.created_at}>{reg.created_at}</Td>
              <Td dataLabel={columnNames.singleAction} modifier="fitContent">
                {unregisterButton}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </TableComposable>
  );
};

export default SatelliteTable;
