import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { connect, useDispatch } from 'react-redux';

import AppSwitcher from './AppSwitcher';
import { appNavClick } from '../../redux/actions';

const documentationLink = {
    insights: 'https://access.redhat.com/documentation/en-us/red_hat_insights/',
    openshift: 'https://docs.openshift.com/dedicated/4/',
    subscriptions: 'https://access.redhat.com/products/subscription-central',
    'cost-management': 'https://access.redhat.com/documentation/en-us/openshift_container_platform/#category-cost-management',
    ansible: 'https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/'
};

export const SideNav = ({ activeTechnology, activeLocation, globalNav, appNav }) => {
    const dispatch = useDispatch();
    useEffect(() => {
        if (globalNav) {
            let defaultActive = {};

            if (!appNav && globalNav) {
                const activeApp = globalNav.find(item => item.active);
                if (activeApp && Object.prototype.hasOwnProperty.call(activeApp, 'subItems')) {
                    defaultActive = activeApp.subItems.find(
                        subItem => location.pathname.split('/').find(item => item === subItem.id)
                    ) || activeApp.subItems.find(subItem => subItem.default)
                            || activeApp.subItems[0];
                }
            }

            dispatch(appNavClick(defaultActive));
        }
    }, [globalNav]);

    return <Fragment>
        <AppSwitcher currentApp={activeTechnology}/>
        <Navigation documentation={documentationLink[activeLocation]} />
    </Fragment>;
};

SideNav.propTypes = {
    activeTechnology: PropTypes.string,
    activeLocation: PropTypes.string,
    globalNav: PropTypes.arrayOf(PropTypes.shape({
        [PropTypes.string]: PropTypes.any
    })),
    appNav: PropTypes.string
};

SideNav.defaultProps = {
    activeTechnology: '',
    activeLocation: ''
};

export default connect(({ chrome: {
    activeTechnology,
    activeLocation,
    globalNav,
    appNav
} }) => ({
    activeTechnology,
    activeLocation,
    globalNav,
    appNav
}))(SideNav);
