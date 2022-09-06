import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, ContextSelector, ContextSelectorItem, Spinner, Text, TextContent } from '@patternfly/react-core';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import axios from 'axios';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

import { onToggleContextSwitcher } from '../../redux/actions';

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
} from '../../consts';

const ContextSwitcher = ({ user, className }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const isOpen = useSelector(({ chrome }) => chrome?.contextSwitcherOpen);
  const [data, setData] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedAccountNumber, setSelectedAccountNumber] = useState(user.identity.account_number);
  const onSelect = () => {
    dispatch(onToggleContextSwitcher());
  };

  const handleItemClick = (target_account, request_id, end_date, target_org) => {
    if (target_account === selectedAccountNumber) {
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
    if (user?.identity?.account_number === selectedAccountNumber) {
      return;
    }
    setSelectedAccountNumber(user?.identity?.account_number);
    Cookies.remove(CROSS_ACCESS_ACCOUNT_NUMBER);
    Cookies.remove(CROSS_ACCESS_ORG_ID);
    localStorage.removeItem(ACTIVE_REMOTE_REQUEST);
    window.location.reload();
  };

  useEffect(() => {
    const initialAccount = localStorage.getItem(ACTIVE_REMOTE_REQUEST);
    if (initialAccount) {
      try {
        setSelectedAccountNumber(JSON.parse(initialAccount).target_account);
      } catch {
        console.log('Unable to parse initial account. Using default account');
      }
    }
    axios
      .get('/api/rbac/v1/cross-account-requests/', {
        params: {
          status: 'approved',
          order_by: '-created',
          query_by: 'user_id',
        },
      })
      .then(({ data: { data } }) =>
        setData(
          data
            .reduce((acc, curr) => (acc.find(({ target_account }) => target_account === curr.target_account) ? acc : [...acc, curr]), [])
            .filter(({ target_account }) => target_account !== user.identity.account_number)
        )
      );
  }, []);

  if (data.length === 0) {
    return null;
  }

  const filteredData = data && data.filter(({ target_account }) => `${target_account}`.includes(searchValue));

  return (
    <ContextSelector
      toggleText={`Account: ${selectedAccountNumber}`}
      className={classNames('chr-c-context-selector', className)}
      onSearchInputChange={(val) => setSearchValue(val)}
      isOpen={isOpen}
      searchInputValue={searchValue}
      onToggle={onSelect}
      onSelect={onSelect}
      screenReaderLabel="Selected account:`"
      ouiaId="Account Switcher"
      searchInputPlaceholder={intl.formatMessage(messages.searchAccount)}
      isFullHeight
    >
      {user && user?.identity?.account_number.includes(searchValue) ? (
        <ContextSelectorItem onClick={resetAccountRequest}>
          <TextContent className="chr-c-content-personal-account">
            <Text className="account-label pf-u-mb-0">
              <span>{user?.identity?.account_number}</span>
              {user?.identity?.account_number === `${selectedAccountNumber}` && (
                <CheckIcon size="sm" color="var(--pf-global--primary-color--100)" className="pf-u-ml-auto" />
              )}
            </Text>
            <Text component="small">{intl.formatMessage(messages.personalAccount)}</Text>
          </TextContent>
        </ContextSelectorItem>
      ) : (
        <Fragment />
      )}
      {filteredData?.length === 0 ? <ContextSelectorItem>{intl.formatMessage(messages.noResults)}</ContextSelectorItem> : <Fragment />}
      {filteredData ? (
        filteredData.map(({ target_account, request_id, end_date, target_org }) => (
          <ContextSelectorItem onClick={() => handleItemClick(target_account, request_id, end_date, target_org)} key={request_id}>
            {target_account}
            {target_account === selectedAccountNumber && (
              <CheckIcon size="sm" color="var(--pf-global--primary-color--100)" className="pf-u-ml-auto" />
            )}
          </ContextSelectorItem>
        ))
      ) : (
        <ContextSelectorItem>
          <Bullseye>
            <Spinner size="md" />
          </Bullseye>
        </ContextSelectorItem>
      )}
    </ContextSelector>
  );
};

ContextSwitcher.propTypes = {
  user: PropTypes.object,
  className: PropTypes.string,
};

export default ContextSwitcher;
