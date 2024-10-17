import './UserToggle.scss';

import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { ITLess, getEnv, isProd as isProdEnv } from '../../utils/common';
import React, { useContext, useRef, useState } from 'react';

import ChromeLink from '../ChromeLink/ChromeLink';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import QuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/question-circle-icon';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import UserIcon from './UserIcon';
import classNames from 'classnames';
import messages from '../../locales/Messages';
import { useIntl } from 'react-intl';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useFlag } from '@unleash/proxy-client-react';

const DropdownItems = ({
  username = '',
  isOrgAdmin,
  accountNumber,
  orgId,
  isInternal,
  extraItems = [],
}: {
  username?: string;
  isOrgAdmin?: boolean;
  accountNumber?: string;
  orgId?: string;
  isInternal?: boolean;
  extraItems?: React.ReactNode[];
}) => {
  const env = getEnv();
  const isProd = isProdEnv();
  const isITLessEnv = ITLess();
  const intl = useIntl();
  const prefix = isProd ? '' : `${env === 'ci' ? 'qa' : env}.`;
  const accountNumberTooltip = `${intl.formatMessage(messages.useAccountNumber)}`;
  const questionMarkRef = useRef(null);
  const { logout } = useContext(ChromeAuthContext);
  const enableMyUserAccessLanding = useFlag('platform.chrome.my-user-access-landing-page');
  const myUserAccessPath = enableMyUserAccessLanding ? '/iam/user-access/overview' : '/iam/my-user-access';

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
                    <span ref={questionMarkRef} className="visible-pointer pf-v6-u-ml-sm">
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
      {orgId && (
        <DropdownItem key="Org ID" isDisabled ouiaId="chrome-user-org-id">
          <dl className="chr-c-dropdown-item__stack">
            <dt className="chr-c-dropdown-item__stack--header">{intl.formatMessage(messages.orgId)}</dt>
            <dd className="chr-c-dropdown-item__stack--value">{orgId}</dd>
          </dl>
        </DropdownItem>
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
          <ChromeLink className={className} href={myUserAccessPath} appId="rbac">
            {intl.formatMessage(messages.myUserAccess)}
          </ChromeLink>
        )}
        key="My user access"
      />
    </React.Fragment>,
    <React.Fragment key="user prefs wrapper">
      <DropdownItem
        component={({ className }) => (
          <ChromeLink className={className} href="/settings/notifications/user-preferences" appId="userPreferences">
            {intl.formatMessage(messages.userPreferences)}
          </ChromeLink>
        )}
        key="User preferences"
      />
    </React.Fragment>,
    <React.Fragment key="internal wrapper">
      {isInternal && isProd && (
        <DropdownItem
          key="Internal"
          component={({ className }) => (
            <ChromeLink className={className} href="/internal" appId="internal">
              {intl.formatMessage(messages.internal)}
            </ChromeLink>
          )}
        />
      )}
    </React.Fragment>,
    <DropdownItem key="logout" component="button" onClick={logout}>
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
  const {
    user: {
      identity: { user, account_number, internal },
    },
  } = useContext(ChromeAuthContext);
  const name = user?.first_name + ' ' + user?.last_name;

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
          className={classNames('data-hj-suppress', 'sentry-mask', { 'pf-v6-u-pr-lg pf-v6-u-pl-lg': isSmall })}
          {...(isSmall
            ? {
                id: 'UserMenu',
                'widget-type': 'UserMenu',
              }
            : {
                icon: <UserIcon />,
              })}
        >
          {isSmall ? <EllipsisVIcon /> : name}
        </MenuToggle>
      )}
      className="chr-c-dropdown-user-toggle"
      isOpen={isOpen}
    >
      <DropdownList>
        {/* Bad PF typings, child nodes can be used */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <DropdownItems
          username={user?.username}
          isOrgAdmin={user?.is_org_admin}
          accountNumber={account_number}
          orgId={internal?.org_id}
          isInternal={user?.is_internal}
          extraItems={extraItems}
        />
      </DropdownList>
    </Dropdown>
  );
};

// TODO update this to use account_id
export default UserToggle;
