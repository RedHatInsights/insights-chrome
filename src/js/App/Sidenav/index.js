import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { Split, SplitItem } from '@patternfly/react-core';
import { HomeIcon } from '@patternfly/react-icons';
import { connect } from 'react-redux';

const documentationLink = {
    rhel: 'https://access.redhat.com/documentation/en-us/cloud_management_services_for_red_hat_enterprise_linux/1.0/',
    insights: 'https://access.redhat.com/documentation/en-us/red_hat_insights/',
    openshift: 'https://docs.openshift.com/container-platform/latest/',
    subscriptions: 'https://access.redhat.com/documentation/Subscription_Central/'
};

export class SideNav extends Component {
    render() {
        const { activeTechnology, activeLocation } = this.props;
        return (<Fragment>
            <Split className="ins-c-navigation__header">
                <SplitItem className="ins-c-page__home-icon">
                    <a href={`${ document.baseURI }`}>
                        <HomeIcon size="md" />
                    </a>
                </SplitItem>
                <SplitItem isFilled className="pf-u-display-flex pf-u-align-items-center ins-c-navigation__header-title__wrapper">
                    <div className="ins-c-navigation__header-title">
                        {activeTechnology}
                    </div>
                </SplitItem>
            </Split>
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
