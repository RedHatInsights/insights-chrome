import React, { Component } from 'react';

import { DropdownToggle, DropdownItem, DropdownPosition, Dropdown } from '@patternfly/react-core';
import PropTypes from 'prop-types';
import ChromeLink from '../Sidenav/Navigation/ChromeLink';
import { isBeta } from '../../utils';

class ToolbarToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.onSelect = this.onSelect.bind(this);
    this.onToggle = this.onToggle.bind(this);
  }

  onSelect() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  onToggle(isOpen) {
    this.setState({ isOpen });
  }

  onClick(ev, url, onClick) {
    ev.preventDefault();
    if (url) {
      window.location.href = `${url}`;
    }

    if (onClick) {
      onClick(ev);
    }
  }

  render() {
    // Render the questionmark icon items
    const dropdownItems = this.props.dropdownItems.map(
      ({ url, appId, title, onClick, isHidden, target = '_blank', rel = 'noopener noreferrer', ...rest }) =>
        !isHidden ? (
          <DropdownItem
            key={title}
            ouiaId={title}
            component={
              appId ? (
                <ChromeLink href={url} target={target} rel={rel} isBeta={isBeta()} appId={appId}>
                  {title}
                </ChromeLink>
              ) : url ? (
                'a'
              ) : (
                'button'
              )
            }
            // Because the urls are using 'a', don't use onClick for accessibility
            // If it is a button, use the onClick prop
            {...(appId
              ? {}
              : url
              ? {
                  href: url,
                  target,
                  rel,
                  ...rest,
                }
              : { onClick: (ev) => this.onClick(ev, url, onClick) })}
          >
            {title}
          </DropdownItem>
        ) : (
          <React.Fragment key="fragment" />
        )
    );

    const toggle = (
      <DropdownToggle
        className={this.props.className}
        id={this.props.id}
        ouiaId={this.props.id}
        toggleIndicator={this.props.hasToggleIndicator}
        onToggle={this.onToggle}
      >
        {this.props.icon && <this.props.icon />}
      </DropdownToggle>
    );

    return (
      <Dropdown
        position={DropdownPosition.right}
        toggle={toggle}
        isOpen={this.state.isOpen}
        dropdownItems={dropdownItems}
        onSelect={this.onSelect}
        ouiaId={this.props.ouiaId}
        isPlain
      />
    );
  }
}

ToolbarToggle.propTypes = {
  icon: PropTypes.elementType,
  dropdownItems: PropTypes.array,
  widgetType: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hasToggleIndicator: PropTypes.bool,
  ouiaId: PropTypes.string,
  isHidden: PropTypes.bool,
};

export default ToolbarToggle;
