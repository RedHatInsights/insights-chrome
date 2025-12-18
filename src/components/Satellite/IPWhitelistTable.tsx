import React, { useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateVariant } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { ValidatedOptions } from '@patternfly/react-core/dist/dynamic/helpers/constants';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import { InnerScrollContainer, OuterScrollContainer, Table, TableText, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import axios from 'axios';
import SkeletonTable from '@redhat-cloud-services/frontend-components/SkeletonTable';

type IPBlock = {
  ip_block: string;
  org_id: string;
  created_at: string;
};

const IPWhitelistTable: React.FC = () => {
  const [allAddresses, setAllAddresses] = useState<IPBlock[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [inputAddresses, setInputAddresses] = useState('');
  const [inputAddressesValidated, setInputAddressesesValidated] = useState(false);
  const [removeAddresses, setRemoveAddresses] = useState('');
  const [isIPModalOpen, setIsIPModalOpen] = useState(false);
  const [isIPRemoveModalOpen, setIsIPRemoveModalOpen] = useState(false);

  const getIPAddresses = () => {
    return axios.get('/api/mbop/v1/allowlist');
  };

  const removeIPAddresses = (ipBlock: string) => {
    return axios.delete(`/api/mbop/v1/allowlist?block=${ipBlock}`);
  };

  const addIPAddresses = (ipBlock: string) => {
    return axios.post('/api/mbop/v1/allowlist', { ip_block: ipBlock });
  };

  useEffect(() => {
    if (!loaded && !actionPending) {
      getIPAddresses()
        .then((res) => {
          setAllAddresses(res.data);
          setLoaded(true);
        })
        .catch((err) => console.error(err));
    }
  }, [loaded, actionPending]);

  const onChangedAddresses = (value: string) => {
    setInputAddresses(value);
    setInputAddressesesValidated(validateIPAddress(value));
  };

  const onSubmitAddresses = () => {
    setActionPending(true);
    addIPAddresses(inputAddresses)
      .then(() => {
        setInputAddresses('');
        setIsIPModalOpen(false);
        setLoaded(false);
        return getIPAddresses();
      })
      .then((res) => {
        setAllAddresses(res.data);
        setLoaded(true);
      })
      .catch((err) => console.error(err))
      .finally(() => setActionPending(false));
  };

  const onRemoveAddresses = () => {
    setActionPending(true);
    removeIPAddresses(removeAddresses)
      .then(() => {
        setRemoveAddresses('');
        setIsIPRemoveModalOpen(false);
        setLoaded(false);
        return getIPAddresses();
      })
      .then((res) => {
        setAllAddresses(res.data);
        setLoaded(true);
      })
      .catch((err) => console.error(err))
      .finally(() => setActionPending(false));
  };

  const onChangedAddressesDebounced = debounce(onChangedAddresses, 500);

  const validateIPAddress = (address: string) => {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([1-9]|[12][0-9]|3[0-2]))?$/.test(
      address
    );
  };

  const validationError = inputAddresses.length > 0 && !inputAddressesValidated;

  const addIPModal = (
    <Modal
      isOpen={isIPModalOpen}
      onClose={() => {
        setInputAddresses('');
        setIsIPModalOpen(false);
      }}
      title={'Add IP addresses to allowlist'}
      variant={ModalVariant.medium}
    >
      <Form onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}>
        <FormGroup>
          <Content>
            <Content component="p">
              Before connecting to your satellite servers, Red Hat needs to add your IP address or range of IP addresses to an allowlist.
            </Content>
          </Content>
          <TextInput
            validated={validationError ? ValidatedOptions.error : ValidatedOptions.default}
            placeholder="127.0.0.1/32"
            onChange={(_event, value) => onChangedAddressesDebounced(value)}
          ></TextInput>
          {validationError && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                  Enter a valid IP address or CIDR notation IP range
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
        <ActionGroup>
          <Button isDisabled={inputAddresses.length <= 0 || validationError || actionPending} onClick={onSubmitAddresses}>
            Submit
          </Button>
        </ActionGroup>
      </Form>
    </Modal>
  );

  const removeIPModal = (
    <Modal
      isOpen={isIPRemoveModalOpen}
      onClose={() => {
        setRemoveAddresses('');
        setIsIPRemoveModalOpen(false);
      }}
      title={'Remove IP addresses from allowlist'}
      variant={ModalVariant.medium}
    >
      <Form onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}>
        <FormGroup>
          <Content>
            <Content component="p">The following IP addresses will be removed from the allowlist</Content>
          </Content>
          <TextInput isDisabled value={removeAddresses}></TextInput>
        </FormGroup>
        <ActionGroup>
          <Button onClick={onRemoveAddresses} isDisabled={actionPending} variant="danger">
            Remove
          </Button>
        </ActionGroup>
      </Form>
    </Modal>
  );

  const columnNames = {
    ip_block: 'IP Block',
    org_id: 'Org ID',
    created_at: 'Created At',
    remove: '',
  };

  const skeletonTable = <SkeletonTable variant={TableVariant.compact} rows={9} columns={Object.values(columnNames)} />;

  const emptyTable = (
    <Tr style={{ border: 'none' }}>
      <Td colSpan={8}>
        <Bullseye>
          <EmptyState headingLevel="h2" titleText="No IP addresses allowed" variant={EmptyStateVariant.sm}>
            <EmptyStateBody>
              Before connecting to your satellite servers, Red Hat needs to add your IP address or range of IP addresses to an allow-list.
            </EmptyStateBody>
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>
  );

  const ipTable = (
    <OuterScrollContainer style={{ maxHeight: '25rem' }}>
      <InnerScrollContainer>
        <Table aria-label="IP allowlist" variant={TableVariant.compact} isStickyHeader>
          <Thead>
            <Tr>
              <Th>{columnNames.ip_block}</Th>
              <Th>{columnNames.org_id}</Th>
              <Th>{columnNames.created_at}</Th>
              <Th>{columnNames.remove}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {allAddresses.length <= 0 && emptyTable}
            {allAddresses.map((ipBlock) => (
              <Tr key={ipBlock.ip_block}>
                <Td dataLabel={columnNames.ip_block}>{ipBlock.ip_block}</Td>
                <Td dataLabel={columnNames.org_id}>{ipBlock.org_id}</Td>
                <Td dataLabel={columnNames.created_at}>{new Date(ipBlock.created_at).toLocaleString()}</Td>
                <Td dataLabel={columnNames.remove} modifier="fitContent">
                  <TableText>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setRemoveAddresses(ipBlock.ip_block);
                        setIsIPRemoveModalOpen(true);
                      }}
                    >
                      Remove
                    </Button>
                  </TableText>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </InnerScrollContainer>
    </OuterScrollContainer>
  );

  return (
    <>
      {addIPModal}
      {removeIPModal}
      <>
        {loaded ? ipTable : skeletonTable}
        <div>
          <Button onClick={() => setIsIPModalOpen(true)}>Add IP Addresses</Button>
        </div>
      </>
    </>
  );
};

export default IPWhitelistTable;
