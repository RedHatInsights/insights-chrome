import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle } from '@patternfly/react-core';

import { useDispatch, useSelector } from 'react-redux';
import { onToggleContextSwitcher } from '../../redux/actions';
import './ContextSwitcher.scss';

const ContextSwitcher = ({ user }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(({ chrome }) => chrome?.contextSwitcherOpen);
  const onSelect = () => {
    dispatch(onToggleContextSwitcher());
  };
  return (
    <Dropdown
      className="ins-c-page__context-switcher-dropdown"
      onSelect={onSelect}
      toggle={<DropdownToggle onToggle={() => dispatch(onToggleContextSwitcher())}>Viewing account: {user.identity.account_number}</DropdownToggle>}
      isOpen={isOpen}
      isPlain
    >
      [Panel contents here]
      <div className="viewing-as">Viewing as Account {user.identity.account_number}</div>
    </Dropdown>
  );
};

ContextSwitcher.propTypes = {
  user: PropTypes.object,
};

export default ContextSwitcher;
