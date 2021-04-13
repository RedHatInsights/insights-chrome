import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { SearchInput } from '@patternfly/react-core/dist/js/components/SearchInput/SearchInput';

import { useDispatch, useSelector } from 'react-redux';
import { onToggleContextSwitcher } from '../../redux/actions';
import './ContextSwitcher.scss';

const ContextSwitcher = ({ user }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(({ chrome }) => chrome?.contextSwitcherOpen);
  const [searchValue, setSearchValue] = useState('');
  const onSelect = () => {
    dispatch(onToggleContextSwitcher());
  };
  const dropdownItems = [
    <SearchInput value={searchValue} onChange={(_, val) => setSearchValue(val.target.value)} key="Search account" placeholder="Search account" />,
    <DropdownItem onClick={onSelect} key={user.identity.account_number} description="PERSONAL ACCOUNT">
      {user.identity.account_number}
    </DropdownItem>,
    <DropdownItem onClick={onSelect} key="678909">
      678909
    </DropdownItem>,
    <DropdownItem onClick={onSelect} key="678735">
      678735
    </DropdownItem>,
    <DropdownItem onClick={onSelect} key="123456">
      123456
    </DropdownItem>,
    <div key={`${user.identity.account_number}`} className="viewing-as">
      Viewing as Account {user.identity.account_number}
    </div>,
  ];

  return (
    <Dropdown
      className="ins-c-page__context-switcher-dropdown"
      ouiaId="Account Switcher"
      toggle={<DropdownToggle onToggle={() => dispatch(onToggleContextSwitcher())}>Viewing account: {user.identity.account_number}</DropdownToggle>}
      isOpen={isOpen}
      dropdownItems={dropdownItems}
    />
  );
};

ContextSwitcher.propTypes = {
  user: PropTypes.object,
};

export default ContextSwitcher;
