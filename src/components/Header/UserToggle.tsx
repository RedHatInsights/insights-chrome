import React, { useState } from 'react';
import { Dropdown, DropdownItem, DropdownPosition, DropdownSeparator, DropdownToggle, KebabToggle, Tooltip } from '@patternfly/react-core';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import UserIcon from './UserIcon';
import { useSelector } from 'react-redux';
import { ITLess, getEnv, isBeta, isProd as isProdEnv } from '../../utils/common';
import ChromeLink from '../ChromeLink/ChromeLink';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { ReduxState } from '../../redux/store';
import { logout } from '../../jwt/jwt';
import { cogLogout } from '../../cognito/auth';

const buildItems = (
  username = '',
  isOrgAdmin?: boolean,
  accountNumber: string | number = -1,
  isInternal?: boolean,
  extraItems: React.ReactNode[] = []
) => {
  const env = getEnv();
  const isProd = isProdEnv();
  const isITLessEnv = ITLess();
  const intl = useIntl();
  const prefix = isProd ? '' : `${env === 'ci' ? 'qa' : env}.`;
  const accountNumberTooltip = `${intl.formatMessage(messages.useAccountNumber)}`;
  return [
    <DropdownItem key="Username" isDisabled>
      <dl className="chr-c-dropdown-item__stack">
        <dt className="chr-c-dropdown-item__stack--header">{intl.formatMessage(messages.username)}</dt>
        <dd className="chr-c-dropdown-item__stack--value data-hj-suppress sentry-mask">{username}</dd>
        {isOrgAdmin && <dd className="chr-c-dropdown-item__stack--subValue">{intl.formatMessage(messages.orgAdministrator)}</dd>}
      </dl>
    </DropdownItem>,
    <React.Fragment key="account wrapper">
      {accountNumber > -1 && (
        <DropdownItem key="Account" isPlainText className="disabled-pointer">
          <dl className="chr-c-dropdown-item__stack">
            {!isITLessEnv && (
              <>
                <dt className="chr-c-dropdown-item__stack--header">
                  {intl.formatMessage(messages.accountNumber)}
                  <span className="visible-pointer pf-u-ml-sm">
                    <Tooltip id="accountNumber-tooltip" content={accountNumberTooltip}>
                      <QuestionCircleIcon />
                    </Tooltip>
                  </span>
                </dt>
                <dd className="chr-c-dropdown-item__stack--value sentry-mask data-hj-suppress">{accountNumber}</dd>
              </>
            )}
            {isInternal && <dd className="chr-c-dropdown-item__stack--subValue">{intl.formatMessage(messages.internalUser)}</dd>}
          </dl>
        </DropdownItem>
      )}
    </React.Fragment>,
    <DropdownSeparator key="separator" />,
    <React.Fragment key="My Profile wrapper">
      {!isITLessEnv && (
        <DropdownItem
          key="My Profile"
          href={`https://www.${prefix}redhat.com/wapps/ugc/protected/personalInfo.html`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {intl.formatMessage(messages.myProfile)}
        </DropdownItem>
      )}
    </React.Fragment>,
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
            <ChromeLink href="/user-preferences/notifications" isBeta={isBeta()} appId="userPreferences">
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
    <DropdownItem key="logout" component="button" onClick={() => (isITLessEnv ? cogLogout() : logout(true))}>
      {intl.formatMessage(messages.logout)}
    </DropdownItem>,
    extraItems,
  ];
};

export type UserToggleProps = {
  isSmall?: boolean;
  extraItems?: React.ReactNode[];
};

const UserToggle = ({ isSmall = false, extraItems = [] }: UserToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const account = useSelector(({ chrome }: ReduxState) => {
    return {
      number: chrome.user?.identity.account_number || 1,
      username: chrome.user?.identity.user?.username,
      isOrgAdmin: chrome.user?.identity.user?.is_org_admin,
      isInternal: chrome.user?.identity.user?.is_internal,
      name: `${chrome.user?.identity.user?.first_name || ''} ${chrome.user?.identity.user?.last_name || ''}`,
    };
  });

  const onSelect = () => {
    setIsOpen(!isOpen);
  };

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };
  const toggle = isSmall ? (
    <KebabToggle onToggle={onToggle} className="data-hj-suppress sentry-mask" />
  ) : (
    <DropdownToggle id="UserMenu" icon={<UserIcon />} className="data-hj-suppress sentry-mask" widget-type="UserMenu" onToggle={onToggle}>
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
      isFullHeight
    />
  );
};

// TODO update this to use account_id
export default UserToggle;
