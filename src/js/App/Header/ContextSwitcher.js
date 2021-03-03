import React from 'react';
// import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle } from '@patternfly/react-core';

// import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';

import './ContextSwitcher.scss';
// import useGlobalNav from '../../utils/useGlobalNav';

import { useDispatch, useSelector } from 'react-redux';
import { onToggleContextSwitcher } from '../../redux/actions';
const ContextSwitcher = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(({ chrome }) => chrome?.contextSwitcherOpen);
  const onSelect = (event) => {
    dispatch(onToggleContextSwitcher());
  };
  return (
    <Dropdown
      className="ins-c-page__context-switcher-dropdown"
      onSelect={onSelect}
      toggle={<DropdownToggle onToggle={() => dispatch(onToggleContextSwitcher())}>Viewing account: 567890</DropdownToggle>}
      isOpen={isOpen}
      isPlain
    >
      [Panel contents here]
      <div className="viewing-as">Viewing as Account 567890</div>
    </Dropdown>
  );
};
export default ContextSwitcher;
// ContextSwitcher.propTypes = {};
