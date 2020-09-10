import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { connect, useDispatch } from 'react-redux';

import AppSwitcher from './AppSwitcher';
import { appNavClick } from '../../redux/actions';
import NavLoader from './Loader';

export const SideNav = ({ activeTechnology, globalNav }) => {
    const dispatch = useDispatch();
    useEffect(() => {
        if (globalNav) {
            const { subItems } = globalNav?.find?.(({ active }) => active) || {};
            const defaultActive = subItems?.find?.(
                ({ id }) => location.pathname.split('/').find(item => item === id)
            ) ||
            subItems?.find?.(({ default: isDefault }) => isDefault) ||
            subItems?.[0];

            dispatch(appNavClick(defaultActive || {}));
        }
    }, [globalNav]);

    return globalNav ? <Fragment>
        <AppSwitcher currentApp={activeTechnology}/>
        <Navigation />
    </Fragment> : <NavLoader />;
};

SideNav.propTypes = {
    activeTechnology: PropTypes.string,
    globalNav: PropTypes.arrayOf(PropTypes.shape({
        [PropTypes.string]: PropTypes.any
    }))
};

SideNav.defaultProps = {
    activeTechnology: '',
    activeLocation: ''
};

export default connect(({ chrome: {
    activeTechnology,
    globalNav,
    appNav
} }) => ({
    activeTechnology,
    globalNav,
    appNav
}))(SideNav);
