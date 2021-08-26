import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, ContextSelector, ContextSelectorItem, Spinner } from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import axios from 'axios';

import { onToggleContextSwitcher } from '../../redux/actions';

import './ContextSwitcher.scss';
import { Fragment } from 'react';
import Cookies from 'js-cookie';

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
          // status: 'approved',
        },
      })
      .then(({ data: { data } }) => setData(data));
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
      {filteredData?.length === 0 ? <ContextSelectorItem>No results</ContextSelectorItem> : <Fragment />}
      {filteredData ? (
        filteredData.map(({ target_account, request_id, end_date }) => (
          <ContextSelectorItem onClick={() => handleItemClick(target_account, request_id, end_date)} key={request_id}>
            {target_account}
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
