import React, { useState } from 'react';

import classNames from 'classnames';

import { Dropdown } from '@patternfly/react-core4/dist/js/components/Dropdown/Dropdown';
import { DropdownItem } from '@patternfly/react-core4/dist/js/components/Dropdown/DropdownItem';
import { DropdownToggle} from '@patternfly/react-core4/dist/js/components/Dropdown/DropdownToggle';
import { CaretDownIcon } from '@patternfly/react-icons';

import './AppSwitcher.scss';

const AppSwitcher = ({ currentApp }) => {

    const [isOpen, setIsOpen] = useState(false);

    const dropdownItems = (activeApp) => {

        // TODO make this app list better and add urls
        const appList = [
            'Red Hat Insights',
            'Red Hat OpenShift Cluster Manager',
            'Red Hat Ansible Automation Platform',
            'Cost Management',
            'Migration Services',
            'Subscription Watch'
        ]

        // TODO add href
        const renderNavItems = appList.map(name =>
            <DropdownItem
                component='a'
                className={classNames({'ins-c-app-switcher__current': name === activeApp })}
                key={name}>
                {name}
            </DropdownItem>
        );

        return renderNavItems;
    };

    return(
        <section className='ins-c-app-switcher'>
            <Dropdown
                isPlain
                className='ins-c-app-switcher__dropdown'
                onSelect={() => setIsOpen(!isOpen)}
                toggle={
                    <DropdownToggle id="toggle-id" onToggle={() => setIsOpen(!isOpen)} toggleIndicator={CaretDownIcon}>
                        { currentApp }
                    </DropdownToggle>
                }
                isOpen={isOpen}
                dropdownItems={dropdownItems(currentApp)}
            />
        </section>
    )
}

export default AppSwitcher;
