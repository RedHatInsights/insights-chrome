import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, ContextSelector, ContextSelectorItem, Spinner, TextContent, Text } from '@patternfly/react-core';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import axios from 'axios';

import { onToggleContextSwitcher } from '../../redux/actions';

import './ContextSwitcher.scss';
import { Fragment } from 'react';
import Cookies from 'js-cookie';
import { ACTIVE_ACCOUNT_SWITCH_NOTIFICATION, REQUESTS_COUNT, REQUESTS_DATA } from '../../consts';

const ContextSwitcher = ({ user, className }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(({ chrome }) => chrome?.contextSwitcherOpen);
  const [data, setData] = useState(undefined);
  const [searchValue, setSearchValue] = useState('');
  const [selectedAccountNumber, setSelectedAccountNumber] = useState(user.identity.account_number);
  const onSelect = () => {
    dispatch(onToggleContextSwitcher());
  };

  const handleItemClick = (target_account, request_id, end_date) => {
    if (target_account === selectedAccountNumber) {
      return;
    }
    localStorage.removeItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION);
    localStorage.removeItem(REQUESTS_COUNT);
    localStorage.removeItem(REQUESTS_DATA);
    setSelectedAccountNumber(target_account);
    Cookies.set('cross_access_account_number', target_account);
    /**
     * We need to keep the request id somewhere to check if the request is still active after session start.
     * If it is not active, we have to remove the cookie.
     * This has to happen before ANY API call is made.
     */
    localStorage.setItem(
      'chrome/active-remote-request',
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
    Cookies.remove('cross_access_account_number');
    localStorage.removeItem('chrome/active-remote-request');
    window.location.reload();
  };

  useEffect(() => {
    const initialAccount = localStorage.getItem('chrome/active-remote-request');
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
          approved_only: true,
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

  const filteredData = data && data.filter(({ target_account }) => `${target_account}`.includes(searchValue));

  return (
    <ContextSelector
      toggleText={`Acct: ${selectedAccountNumber}`}
      className={classNames('ins-c-page__context-switcher-dropdown', className)}
      onSearchInputChange={(val) => setSearchValue(val)}
      isOpen={isOpen}
      searchInputValue={searchValue}
      onToggle={onSelect}
      onSelect={onSelect}
      screenReaderLabel="Selected account:`"
      ouiaId="Account Switcher"
      searchInputPlaceholder="Search account"
    >
      {user && user?.identity?.account_number.includes(searchValue) ? (
        <ContextSelectorItem onClick={resetAccountRequest}>
          <TextContent className="personal-account">
            <Text className="account-label pf-u-mb-0">
              <span>{user?.identity?.account_number}</span>
              {user?.identity?.account_number === `${selectedAccountNumber}` && (
                <CheckIcon size="sm" color="var(--pf-global--primary-color--100)" className="pf-u-ml-auto" />
              )}
            </Text>
            <Text component="small">Personal account</Text>
          </TextContent>
        </ContextSelectorItem>
      ) : (
        <Fragment />
      )}
      {filteredData?.length === 0 ? <ContextSelectorItem>No results</ContextSelectorItem> : <Fragment />}
      {filteredData ? (
        filteredData.map(({ target_account, request_id, end_date }) => (
          <ContextSelectorItem onClick={() => handleItemClick(target_account, request_id, end_date)} key={request_id}>
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
      <div className="viewing-as" index="5">
        Viewing as Account {selectedAccountNumber}
      </div>
    </ContextSelector>
  );
};

ContextSwitcher.propTypes = {
  user: PropTypes.object,
  className: PropTypes.string,
};

export default ContextSwitcher;
