import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Dropdown } from '@patternfly/react-core/dist/js/components/Dropdown/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownItem';
import { DropdownToggle } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownToggle';
import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/components/cjs/Skeleton';
import { connect } from 'react-redux';

import './AppSwitcher.scss';

const AppSwitcher = ({ currentApp, globalNav }) => {

    const [isOpen, setIsOpen] = useState(false);

    const dropdownItems = (activeApp) => {

        const appList = [
            { title: 'Red Hat Insights', id: 'insights' },
            { title: 'Red Hat OpenShift Cluster Manager', id: 'openshift' },
            { title: 'Red Hat Ansible Automation Platform', id: 'ansible' },
            { title: 'Cost Management', id: 'cost-management' },
            { title: 'Migration Services', id: 'migrations' },
            { title: 'Subscription Watch', id: 'subscriptions' }
        ];

        const renderNavItems = appList.map(app =>
            <DropdownItem
                component='a'
                href={`${document.baseURI}${app.id}`}
                className={classNames({ 'ins-c-app-switcher__current': app.title === activeApp })}
                key={app.id}>
                {app.title}
            </DropdownItem>
        );

        return renderNavItems;

    };

    return (
        <section className={`ins-c-app-switcher${globalNav ? '' : '--loading'}`}>
            {
                globalNav ? (
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
                ) : <Skeleton size={SkeletonSize.lg} className="ins-m-dark"/>
            }
        </section>
    );
};

export default connect(({ chrome: { globalNav } }) => ({ globalNav }))(AppSwitcher);

AppSwitcher.propTypes = {
    currentApp: PropTypes.string,
    globalNav: PropTypes.shape({
        [PropTypes.string]: PropTypes.any
    })
};
