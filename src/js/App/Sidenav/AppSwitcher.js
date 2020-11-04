import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Dropdown } from '@patternfly/react-core/dist/js/components/Dropdown/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownItem';
import { DropdownToggle } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownToggle';
import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';

import './AppSwitcher.scss';

const AppSwitcher = ({ currentApp }) => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownItems = (activeApp) => {
    const appList = [
      { title: 'Red Hat Insights', id: 'insights', type: 'link' },
      { title: 'Red Hat OpenShift Cluster Manager', id: 'openshift', type: 'link' },
      { title: 'Red Hat Ansible Automation Platform', id: 'ansible', type: 'link' },
      { title: 'Cost Management', id: 'cost-management', type: 'link' },
      { title: 'Migration Services', id: 'migrations', type: 'link' },
      { title: 'Subscription Watch', id: 'subscriptions', type: 'link' },
      { type: 'separator', id: 'separator' },
      { title: 'Settings', id: 'settings', type: 'link' },
      { title: 'User Preferences', id: 'user-preferences', type: 'link' },
    ];

    const renderNavItems = appList.map((app) => (
      <DropdownItem
        {...(app.type === 'link'
          ? {
              component: 'a',
              href: `${document.baseURI}${app.id}`,
              className: classNames({ 'ins-c-app-switcher__current': app.title === activeApp }),
            }
          : {
              component: 'div',
              className: 'pf-c-divider',
            })}
        key={app.id}
        ouiaId={app.id}
      >
        {app.title}
      </DropdownItem>
    ));

    return renderNavItems;
  };

  return (
    <section className="ins-c-app-switcher">
      <Dropdown
        isPlain
        className="ins-c-app-switcher__dropdown"
        onSelect={() => setIsOpen(!isOpen)}
        toggle={
          <DropdownToggle id="toggle-id" onToggle={() => setIsOpen(!isOpen)} toggleIndicator={CaretDownIcon}>
            {currentApp}
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={dropdownItems(currentApp)}
        ouiaId="App Switcher"
      />
    </section>
  );
};

export default AppSwitcher;

AppSwitcher.propTypes = {
  currentApp: PropTypes.string,
};
