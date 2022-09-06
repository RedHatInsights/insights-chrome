import React, { useState } from 'react';
import { Dropdown, DropdownItem, DropdownPosition, DropdownSeparator, DropdownToggle, KebabToggle, Tooltip } from '@patternfly/react-core';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import UserIcon from './UserIcon';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getEnv, isBeta, isProd as isProdEnv } from '../../utils';
import ChromeLink from '../Sidenav/Navigation/ChromeLink';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const buildItems = (username, isOrgAdmin, accountNumber = -1, isInternal, extraItems) => {
  const env = getEnv();
  const isProd = isProdEnv();
  const intl = useIntl();
  const prefix = isProd ? '' : `${env === 'ci' ? 'qa' : env}.`;
  const accountNumberTooltip = `${intl.formatMessage(messages.useAccountNumber)}`;
  return [
    <DropdownItem key="Username" isDisabled>
      <dl className="chr-c-dropdown-item__stack">
        <dt className="chr-c-dropdown-item__stack--header">{intl.formatMessage(messages.username)}</dt>
        <dd className="chr-c-dropdown-item__stack--value data-hj-suppress">{username}</dd>
        {isOrgAdmin && <dd className="chr-c-dropdown-item__stack--subValue">{intl.formatMessage(messages.orgAdministrator)}</dd>}
      </dl>
    </DropdownItem>,
    <React.Fragment key="account wrapper">
      {accountNumber > -1 && (
        <DropdownItem key="Account" isPlainText className="disabled-pointer">
          <dl className="chr-c-dropdown-item__stack">
            <dt className="chr-c-dropdown-item__stack--header">
              {intl.formatMessage(messages.accountNumber)}
              <span className="visible-pointer pf-u-ml-sm">
                <Tooltip id="accountNumber-tooltip" content={accountNumberTooltip}>
                  <QuestionCircleIcon />
                </Tooltip>
              </span>
            </dt>
            <dd className="chr-c-dropdown-item__stack--value">{accountNumber}</dd>
            {isInternal && <dd className="chr-c-dropdown-item__stack--subValue">{intl.formatMessage(messages.internalUser)}</dd>}
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
      {intl.formatMessage(messages.myProfile)}
    </DropdownItem>,
    <React.Fragment key="My user access wrapper">
      {accountNumber > -1 && isBeta() && (
        <DropdownItem
          component={
            <ChromeLink href="/settings/my-user-access" isBeta={isBeta()} appId="rbac">
              {intl.formatMessage(messages.myUserAccess)}
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
              {intl.formatMessage(messages.userPreferences)}
            </ChromeLink>
          }
          key="User preferences"
        />
      )}
    </React.Fragment>,
    <React.Fragment key="internal wrapper">
      {isInternal && isProd && (
        <DropdownItem key="Internal" href="./internal">
          {intl.formatMessage(messages.internal)}
        </DropdownItem>
      )}
    </React.Fragment>,
    <DropdownItem key="logout" component="button" onClick={() => window.insights.chrome.auth.logout(true)}>
      {intl.formatMessage(messages.logout)}
    </DropdownItem>,
    { extraItems },
  ];
};

export const UserToggle = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  const onSelect = () => {
    setIsOpen(!isOpen);
  };

  const onToggle = (isOpen) => {
    setIsOpen(isOpen);
  };
  const { account, isSmall, extraItems } = props;
  const toggle = isSmall ? (
    <KebabToggle onToggle={onToggle} className="data-hj-suppress" />
  ) : (
    <DropdownToggle id="UserMenu" icon={<UserIcon />} className="data-hj-suppress" widget-type="UserMenu" onToggle={onToggle}>
      {account.name}
    </DropdownToggle>
  );
  return (
    <Dropdown
      position={DropdownPosition.right}
      aria-label="Overflow actions"
      ouiaId="chrome-user-menu"
      onSelect={onSelect}
      toggle={toggle}
      className="chr-c-dropdown-user-toggle"
      isOpen={isOpen}
      dropdownItems={buildItems(account.username, account.isOrgAdmin, account.number, account.isInternal, extraItems)}
    />
  );
};

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
