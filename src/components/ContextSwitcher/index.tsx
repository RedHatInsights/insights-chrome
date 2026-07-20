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
import type { CrossAccountRequestByUserId } from '@redhat-cloud-services/rbac-client/types';

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
  orgId?: string;
  isInternal?: boolean;
};

// query_by=user_id returns ONLY: request_id, target_org, user_id, start_date, end_date, created, status
// query_by=target_org returns name/email via BOP lookup (first_name, last_name, email, user_available)
// ContextSwitcher uses query_by=user_id, so name/email fields are never present
type CrossAccountRequestInternal = CrossAccountRequestByUserId;

/**
 * Resolve the display/dedup identifier for a cross-account request.
 * RBAC API stopped returning target_account on 2026-06-03 (RHCLOUD-36475).
 * Fallback to target_account for pre-migration localStorage/API responses.
 */
const resolveAccountIdentifier = (request: CrossAccountRequestInternal): string | undefined => request.target_org ?? request.target_account;

const ContextSwitcher = ({ orgId, className, isInternal }: ContextSwitcherProps) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useAtom(contextSwitcherOpenAtom);
  const [data, setData] = useState<CrossAccountRequestInternal[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(orgId);
  const onSelect = () => {
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (request_id?: string, end_date?: Date, accountIdentifier?: string) => {
    if (!accountIdentifier || accountIdentifier === selectedOrgId) {
      return;
    }
    localStorage.removeItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION);
    localStorage.removeItem(REQUESTS_COUNT);
    localStorage.removeItem(REQUESTS_DATA);
    setSelectedOrgId(accountIdentifier);

    // RHCLOUD-48475: Only use CROSS_ACCESS_ORG_ID cookie.
    // Do NOT set CROSS_ACCESS_ACCOUNT_NUMBER — that causes 3scale to write org_id into identity.account_number.
    Cookies.set(CROSS_ACCESS_ORG_ID, accountIdentifier);

    /**
     * We need to keep the request id somewhere to check if the request is still active after session start.
     * If it is not active, we have to remove the cookie.
     * This has to happen before ANY API call is made.
     */
    localStorage.setItem(
      ACTIVE_REMOTE_REQUEST,
      JSON.stringify({
        request_id,
        target_org: accountIdentifier,
        end_date,
      })
    );
    localStorage.setItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION, 'true');
    window.location.reload();
  };

  const resetAccountRequest = () => {
    if (orgId === selectedOrgId) {
      return;
    }
    setSelectedOrgId(orgId);
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
          const parsed = JSON.parse(initialAccount);
          // Migrate old localStorage: API removed target_account on 2026-06-03
          const orgId = parsed.target_org ?? parsed.target_account;
          if (orgId) {
            setSelectedOrgId(orgId);
            // Write back migrated format if this was an old entry
            if (!parsed.target_org && parsed.target_account) {
              localStorage.setItem(
                ACTIVE_REMOTE_REQUEST,
                JSON.stringify({
                  request_id: parsed.request_id,
                  target_org: orgId,
                  end_date: parsed.end_date,
                })
              );
            }
          }
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
                  const request = acc.find((item) => resolveAccountIdentifier(item) === resolveAccountIdentifier(curr));
                  if (request) {
                    return acc;
                  }
                  return [...acc, curr];
                }, [])
                .filter((item) => resolveAccountIdentifier(item) !== orgId)
            );
          }
        })
        .catch((error) => {
          console.error('Failed to fetch cross-account requests:', error);
          if (mounted) {
            setData([]);
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

  const filteredData = data && data.filter((item) => `${resolveAccountIdentifier(item)}`.includes(searchValue));

  const contextSwitcherToggle = (toggleRef: React.RefObject<any>) => (
    <MenuToggle ref={toggleRef} isExpanded={isOpen} onClick={onSelect} aria-label="Selected organization:">
      Organization: {selectedOrgId}
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
      {orgId?.includes(searchValue) ? (
        <DropdownItem onClick={resetAccountRequest}>
          <Content className="chr-c-content-account">
            <Content component="p" className="account-label pf-v6-u-mb-0 sentry-mask data-hj-suppress">
              <span>{orgId}</span>
              {orgId === `${selectedOrgId}` && (
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
        filteredData.map((item) => {
          const { request_id, end_date } = item;
          const accountIdentifier = resolveAccountIdentifier(item);
          return (
            <DropdownItem onClick={() => handleItemClick(request_id, end_date, accountIdentifier)} key={request_id}>
              <Content className="chr-c-content-account">
                <Content component="p" className="account-label pf-v6-u-mb-0">
                  <span>{accountIdentifier ?? 'N/A'}</span>
                  {accountIdentifier && accountIdentifier === selectedOrgId && (
                    <Icon size="sm" className="pf-v6-u-ml-auto">
                      <CheckIcon color="var(--pf-t--global--icon--color--brand--default)" />
                    </Icon>
                  )}
                </Content>
              </Content>
            </DropdownItem>
          );
        })
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
