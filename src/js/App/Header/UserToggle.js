import React, { Component } from 'react';
import { DropdownToggle, KebabToggle, DropdownItem, DropdownSeparator, DropdownPosition, Dropdown } from '@patternfly/react-core';
import UserIcon from './UserIcon';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { isBeta } from '../../utils';
import ChromeLink from '../Sidenav/Navigation/ChromeLink';

function buildItems(username, isOrgAdmin, accountNumber = -1, isInternal, extraItems) {
  const env = window.insights.chrome.getEnvironment();
  const isProd = window.insights.chrome.isProd;
  const prefix = isProd ? '' : `${env === 'ci' ? 'qa' : env}.`;
  return [
    <DropdownItem key="Username" isDisabled>
      <dl className="chr-c-dropdown-item__stack">
        <dt className="chr-c-dropdown-item__stack--header">Username:</dt>
        <dd className="chr-c-dropdown-item__stack--value data-hj-suppress">{username}</dd>
        {isOrgAdmin && <dd className="chr-c-dropdown-item__stack--subValue">Org. Administrator</dd>}
      </dl>
    </DropdownItem>,
    <React.Fragment key="account wrapper">
      {accountNumber > -1 && (
        <DropdownItem key="Account" isDisabled>
          <dl className="chr-c-dropdown-item__stack">
            <dt className="chr-c-dropdown-item__stack--header">Account number:</dt>
            <dd className="chr-c-dropdown-item__stack--value">{accountNumber}</dd>
            {isInternal && <dd className="chr-c-dropdown-item__stack--subValue">Internal user</dd>}
          </dl>
        </DropdownItem>
      )}
    </React.Fragment>,
    <DropdownSeparator key="separator" />,
    <DropdownItem
      key="My Profile"
      href={`https://www.${prefix}redhat.com/wapps/ugc/protected/personalInfo.html`}
      target="_blank"
      rel="noopener noreferrer"
    >
      My profile
    </DropdownItem>,
    <React.Fragment key="My user access wrapper">
      {accountNumber > -1 && window.insights.chrome.isBeta() && (
        <DropdownItem
          component={
            <ChromeLink href="/settings/my-user-access" isBeta={isBeta()} appId="rbac">
              My User Access
            </ChromeLink>
          }
          key="My user access"
        />
      )}
    </React.Fragment>,
    <React.Fragment key="user prefs wrapper">
      {accountNumber > -1 && (
        <DropdownItem
          component={
            <ChromeLink href="/user-preferences/email" isBeta={isBeta()} appId="userPreferences">
              User Preferences
            </ChromeLink>
          }
          key="User preferences"
        />
      )}
    </React.Fragment>,
    <React.Fragment key="internal wrapper">
      {isInternal && isProd && (
        <DropdownItem key="Internal" href="./internal">
          Internal
        </DropdownItem>
      )}
    </React.Fragment>,
    <DropdownItem key="logout" component="button" onClick={() => window.insights.chrome.auth.logout(true)}>
      Log out
    </DropdownItem>,
    [...extraItems],
  ];
}

export class UserToggle extends Component {
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
    this.setState({
      isOpen,
    });
  }

  render() {
    const { isOpen } = this.state;
    const { account, isSmall, extraItems } = this.props;
    const toggle = isSmall ? (
      <KebabToggle onToggle={this.onToggle} className="data-hj-suppress" />
    ) : (
      <DropdownToggle id="UserMenu" icon={<UserIcon />} className="data-hj-suppress" widget-type="UserMenu" onToggle={this.onToggle}>
        {account.name}
      </DropdownToggle>
    );
    return (
      <Dropdown
        position={DropdownPosition.right}
        aria-label="Overflow actions"
        ouiaId="chrome-user-menu"
        onSelect={this.onSelect}
        toggle={toggle}
        className="chr-c-dropdown-user-toggle"
        isOpen={isOpen}
        dropdownItems={buildItems(account.username, account.isOrgAdmin, account.number, account.isInternal, extraItems)}
      />
    );
  }
}

UserToggle.propTypes = {
  account: PropTypes.shape({
    number: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    username: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isOrgAdmin: PropTypes.bool,
    isInternal: PropTypes.bool,
  }),
  isSmall: PropTypes.bool,
  extraItems: PropTypes.arrayOf(PropTypes.node),
};

UserToggle.defaultProps = {
  account: {
    number: 1,
    name: 'Foo',
  },
  isSmall: false,
  extraItems: [],
};

/* eslint-disable camelcase */
// TODO update this to use account_id
export default connect(
  ({
    chrome: {
      user: {
        identity: {
          account_number: accountNumber,
          user: { username, first_name, last_name, is_org_admin, is_internal },
        },
      },
    },
  }) => ({
    account: {
      number: accountNumber,
      username: username,
      isOrgAdmin: is_org_admin,
      isInternal: is_internal,
      name: `${first_name} ${last_name}`,
    },
  })
)(UserToggle);

/* eslint-enable camelcase */
