import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { connect } from 'react-redux';

import AppSwitcher from './AppSwitcher';

const documentationLink = {
    insights: 'https://access.redhat.com/documentation/en-us/red_hat_insights/',
    openshift: 'https://docs.openshift.com/dedicated/4/',
    subscriptions: 'https://access.redhat.com/products/subscription-central',
    'cost-management': 'https://access.redhat.com/documentation/en-us/openshift_container_platform/#category-cost-management',
    ansible: 'https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/'
};

export class SideNav extends Component {
    render() {
        const { activeTechnology, activeLocation } = this.props;
        return (<Fragment>
            <AppSwitcher currentApp={activeTechnology}/>
            <Navigation documentation={documentationLink[activeLocation]} />
        </Fragment>);
    }
}

SideNav.propTypes = {
    activeTechnology: PropTypes.string,
    activeLocation: PropTypes.string
};

SideNav.defaultProps = {
    activeTechnology: '',
    activeLocation: ''
};

export default connect(({ chrome: {
    activeTechnology,
    activeLocation
} }) => ({
    activeTechnology,
    activeLocation
}))(SideNav);
