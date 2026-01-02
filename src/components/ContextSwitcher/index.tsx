import React, { useEffect, useState } from 'react';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Dropdown, DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuSearch, MenuSearchInput } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { InputGroup, InputGroupItem } from '@patternfly/react-core/dist/dynamic/components/InputGroup';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import CheckIcon from '@patternfly/react-icons/dist/dynamic/icons/check-icon';
import classNames from 'classnames';
import axios from 'axios';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import type { CrossAccountRequest } from '@redhat-cloud-services/rbac-client/types';

import './ContextSwitcher.scss';
import { Fragment } from 'react';
import Cookies from 'js-cookie';
import {
  ACTIVE_ACCOUNT_SWITCH_NOTIFICATION,
  ACTIVE_REMOTE_REQUEST,
  CROSS_ACCESS_ACCOUNT_NUMBER,
  CROSS_ACCESS_ORG_ID,
  REQUESTS_COUNT,
  REQUESTS_DATA,
} from '../../utils/consts';
import { useAtom } from 'jotai';
import { contextSwitcherOpenAtom } from '../../state/atoms/contextSwitcher';

export type ContextSwitcherProps = {
  className?: string;
  accountNumber?: string;
  isInternal?: boolean;
};

// These attributes are present in the response based on the open API spec.
// TODO: Migrate to the new RBAC JS client when it is ready.
type CrossAccountRequestInternal = CrossAccountRequest & {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
};

const ContextSwitcher = ({ accountNumber, className, isInternal }: ContextSwitcherProps) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useAtom(contextSwitcherOpenAtom);
  const [data, setData] = useState<CrossAccountRequestInternal[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedAccountNumber, setSelectedAccountNumber] = useState(accountNumber);
  const onSelect = () => {
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (target_account?: string, request_id?: string, end_date?: Date, target_org?: string) => {
    if (!target_org || !target_account || target_account === selectedAccountNumber) {
      return;
    }
    localStorage.removeItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION);
    localStorage.removeItem(REQUESTS_COUNT);
    localStorage.removeItem(REQUESTS_DATA);
    setSelectedAccountNumber(target_account);
    Cookies.set(CROSS_ACCESS_ACCOUNT_NUMBER, target_account);
    Cookies.set(CROSS_ACCESS_ORG_ID, target_org);

    /**
     * We need to keep the request id somewhere to check if the request is still active after session start.
     * If it is not active, we have to remove the cookie.
     * This has to happen before ANY API call is made.
     */
    localStorage.setItem(
      ACTIVE_REMOTE_REQUEST,
      JSON.stringify({
        request_id,
        target_account,
        end_date,
      })
    );
    localStorage.setItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION, 'true');
    window.location.reload();
  };

  const resetAccountRequest = () => {
    if (accountNumber === selectedAccountNumber) {
      return;
    }
    setSelectedAccountNumber(accountNumber);
    Cookies.remove(CROSS_ACCESS_ACCOUNT_NUMBER);
    Cookies.remove(CROSS_ACCESS_ORG_ID);
    localStorage.removeItem(ACTIVE_REMOTE_REQUEST);
    window.location.reload();
  };

  useEffect(() => {
    let mounted = true;
    // only inernal users have the TAM features enabled
    if (isInternal) {
      const initialAccount = localStorage.getItem(ACTIVE_REMOTE_REQUEST);
      if (initialAccount) {
        try {
          setSelectedAccountNumber(JSON.parse(initialAccount).target_account);
        } catch {
          console.log('Unable to parse initial account. Using default account');
        }
      }
      axios
        .get<{ data: CrossAccountRequestInternal[] }>('/api/rbac/v1/cross-account-requests/', {
          params: {
            status: 'approved',
            order_by: '-created',
            query_by: 'user_id',
          },
        })
        .then(({ data: { data } }) => {
          if (mounted) {
            setData(
              data
                .reduce<CrossAccountRequestInternal[]>((acc, curr) => {
                  const request = acc.find(({ target_account }) => target_account === curr.target_account);
                  if (request) {
                    return acc;
                  }
                  return [...acc, curr];
                }, [])
                .filter(({ target_account }) => target_account !== accountNumber)
            );
          }
        });
    }
    return () => {
      mounted = false;
    };
  }, []);

  if (data.length === 0) {
    return null;
  }

  const filteredData = data && data.filter(({ target_account }) => `${target_account}`.includes(searchValue));

  const contextSwitcherToggle = (toggleRef: React.RefObject<any>) => (
    <MenuToggle ref={toggleRef} isExpanded={isOpen} onClick={onSelect} aria-label="Selected account:">
      Account: {selectedAccountNumber}
    </MenuToggle>
  );

  return (
    <Dropdown
      toggle={contextSwitcherToggle}
      className={classNames('chr-c-context-selector', className)}
      isOpen={isOpen}
      onSelect={onSelect}
      ouiaId="Account Switcher"
      maxMenuHeight="100%"
    >
      <MenuSearch>
        <MenuSearchInput>
          <InputGroup>
            <InputGroupItem isFill>
              <SearchInput value={searchValue} onChange={(_event, val) => setSearchValue(val)} placeholder={intl.formatMessage(messages.searchAccount)} />
            </InputGroupItem>
          </InputGroup>
        </MenuSearchInput>
      </MenuSearch>
      {accountNumber?.includes(searchValue) ? (
        <DropdownItem onClick={resetAccountRequest}>
          <Content className="chr-c-content-account">
            <Content component="p" className="account-label pf-v6-u-mb-0 sentry-mask data-hj-suppress">
              <span>{accountNumber}</span>
              {accountNumber === `${selectedAccountNumber}` && (
                <Icon size="sm" className="pf-v6-u-ml-auto">
                  <CheckIcon color="var(--pf-t--global--icon--color--brand--default)" />
                </Icon>
              )}
            </Content>
            <Content className="account-name" component="small">
              {intl.formatMessage(messages.personalAccount)}
            </Content>
          </Content>
        </DropdownItem>
      ) : (
        <Fragment />
      )}
      {filteredData?.length === 0 ? <DropdownItem>{intl.formatMessage(messages.noResults)}</DropdownItem> : <Fragment />}
      {filteredData ? (
        filteredData.map(({ target_account, request_id, end_date, target_org, email, first_name, last_name }) => (
          <DropdownItem onClick={() => handleItemClick(target_account, request_id, end_date, target_org)} key={request_id}>
            <Content className="chr-c-content-account">
              <Content component="p" className="account-label">
                <span>{target_account}</span>
                {target_account === selectedAccountNumber && (
                  <Icon size="sm" className="pf-v6-u-ml-auto">
                    <CheckIcon color="var(--pf-t--global--icon--color--brand--default)" />
                  </Icon>
                )}
              </Content>
              <Content className="account-name" component="small">
                {first_name && last_name ? `${first_name} ${last_name}` : email}
              </Content>
            </Content>
          </DropdownItem>
        ))
      ) : (
        <DropdownItem>
          <Bullseye>
            <Spinner size="md" />
          </Bullseye>
        </DropdownItem>
      )}
    </Dropdown>
  );
};

export default ContextSwitcher;
