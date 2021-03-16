import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { SearchInput } from '@patternfly/react-core/dist/js/components/SearchInput/SearchInput';

import { useDispatch, useSelector } from 'react-redux';
import { onToggleContextSwitcher } from '../../redux/actions';
import './ContextSwitcher.scss';

const ContextSwitcher = ({ user }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(({ chrome }) => chrome?.contextSwitcherOpen);
  const onSelect = () => {
    dispatch(onToggleContextSwitcher());
  };
  const dropdownItems = [
    <DropdownItem key={user.identity.account_number} description="PERSONAL ACCOUNT">
      {user.identity.account_number}
    </DropdownItem>,
    <DropdownItem key="678909">678909</DropdownItem>,
    <DropdownItem key="678735">678735</DropdownItem>,
    <DropdownItem key="123456">123456</DropdownItem>,
  ];

  return (
    <Dropdown
      className="ins-c-page__context-switcher-dropdown"
      ouiaId="Account Switcher"
      onSelect={onSelect}
      toggle={<DropdownToggle onToggle={() => dispatch(onToggleContextSwitcher())}>Viewing account: {user.identity.account_number}</DropdownToggle>}
      isOpen={isOpen}
      isPlain
    >
      <SearchInput placeholder="Search account" />
      <ul>{dropdownItems}</ul>
      <div className="viewing-as">Viewing as Account {user.identity.account_number}</div>
    </Dropdown>
  );
};

ContextSwitcher.propTypes = {
  user: PropTypes.object,
};

export default ContextSwitcher;
