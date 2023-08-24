import React, { useRef, useState } from 'react';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import QuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/question-circle-icon';
import UserIcon from './UserIcon';
import { useSelector } from 'react-redux';
import { ITLess, getEnv, isProd as isProdEnv } from '../../utils/common';
import ChromeLink from '../ChromeLink/ChromeLink';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { ReduxState } from '../../redux/store';
import { logout } from '../../jwt/jwt';
import { cogLogout } from '../../cognito/auth';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import classNames from 'classnames';

import './UserToggle.scss';

const buildItems = (username = '', isOrgAdmin?: boolean, accountNumber?: string, isInternal?: boolean, extraItems: React.ReactNode[] = []) => {
  const env = getEnv();
  const isProd = isProdEnv();
  const isITLessEnv = ITLess();
  const intl = useIntl();
  const prefix = isProd ? '' : `${env === 'ci' ? 'qa' : env}.`;
  const accountNumberTooltip = `${intl.formatMessage(messages.useAccountNumber)}`;
  const questionMarkRef = useRef(null);
  return [
    <DropdownItem key="Username" isDisabled>
      <dl className="chr-c-dropdown-item__stack">
        <dt className="chr-c-dropdown-item__stack--header">{intl.formatMessage(messages.username)}</dt>
        <dd className="chr-c-dropdown-item__stack--value data-hj-suppress sentry-mask">{username}</dd>
        {isOrgAdmin && <dd className="chr-c-dropdown-item__stack--subValue">{intl.formatMessage(messages.orgAdministrator)}</dd>}
      </dl>
    </DropdownItem>,
    <React.Fragment key="account wrapper">
      {accountNumber && (
        <Tooltip triggerRef={questionMarkRef} id="accountNumber-tooltip" content={accountNumberTooltip}>
          <DropdownItem component="span" key="Account" className="chr-c-disabled-pointer">
            <dl className="chr-c-dropdown-item__stack">
              {!isITLessEnv && (
                <>
                  <dt className="chr-c-dropdown-item__stack--header">
                    {intl.formatMessage(messages.accountNumber)}
                    <span ref={questionMarkRef} className="visible-pointer pf-v5-u-ml-sm">
                      <QuestionCircleIcon />
                    </span>
                  </dt>
                  <dd className="chr-c-dropdown-item__stack--value sentry-mask data-hj-suppress">{accountNumber}</dd>
                </>
              )}
              {isInternal && <dd className="chr-c-dropdown-item__stack--subValue">{intl.formatMessage(messages.internalUser)}</dd>}
            </dl>
          </DropdownItem>
        </Tooltip>
      )}
    </React.Fragment>,
    <Divider component="li" key="separator" />,
    <React.Fragment key="My Profile wrapper">
      {!isITLessEnv && (
        <DropdownItem
          key="My Profile"
          to={`https://www.${prefix}redhat.com/wapps/ugc/protected/personalInfo.html`}
          target="_blank"
          rel="noopener noreferrer"
          component="a"
        >
          {intl.formatMessage(messages.myProfile)}
        </DropdownItem>
      )}
    </React.Fragment>,
    <React.Fragment key="My user access wrapper">
      <DropdownItem
        component={({ className }) => (
          <ChromeLink className={className} href="/iam/my-user-access" appId="rbac">
            {intl.formatMessage(messages.myUserAccess)}
          </ChromeLink>
        )}
        key="My user access"
      />
    </React.Fragment>,
    <React.Fragment key="user prefs wrapper">
      <DropdownItem
        component={({ className }) => (
          <ChromeLink className={className} href="/user-preferences/notifications" appId="userPreferences">
            {intl.formatMessage(messages.userPreferences)}
          </ChromeLink>
        )}
        key="User preferences"
      />
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
      number: chrome.user?.identity.account_number,
      username: chrome.user?.identity.user?.username,
      isOrgAdmin: chrome.user?.identity.user?.is_org_admin,
      isInternal: chrome.user?.identity.user?.is_internal,
      name: `${chrome.user?.identity.user?.first_name || ''} ${chrome.user?.identity.user?.last_name || ''}`,
    };
  });

  const onSelect = (event: any) => {
    if (['A', 'BUTTON'].includes(event.target.tagName)) {
      setIsOpen(!isOpen);
    }
  };

  const onToggle = () => {
    setIsOpen((prev) => !prev);
  };
  return (
    <Dropdown
      popperProps={{
        position: 'right',
      }}
      aria-label="Overflow actions"
      ouiaId="chrome-user-menu"
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          isFullHeight
          onClick={onToggle}
          variant={isSmall ? 'plain' : undefined}
          className={classNames('data-hj-suppress', 'sentry-mask', { 'pf-v5-u-pr-lg pf-v5-u-pl-lg': isSmall })}
          {...(isSmall
            ? {
                id: 'UserMenu',
                'widget-type': 'UserMenu',
              }
            : {
                icon: <UserIcon />,
              })}
        >
          {isSmall ? <EllipsisVIcon /> : account.name}
        </MenuToggle>
      )}
      className="chr-c-dropdown-user-toggle"
      isOpen={isOpen}
    >
      <DropdownList>{buildItems(account.username, account.isOrgAdmin, account.number, account.isInternal, extraItems)}</DropdownList>
    </Dropdown>
  );
};

// TODO update this to use account_id
export default UserToggle;
