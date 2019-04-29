import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { Split, SplitItem } from '@patternfly/react-core/dist/esm/layouts/Split';
import HomeIcon from '@patternfly/react-icons/dist/esm/icons/home-icon';
import { connect } from 'react-redux';

const documentationLink = {
    rhel: 'https://access.redhat.com/documentation/cloud_management_services_for_red_hat_enterprise_linux',
    insights: 'https://access.redhat.com/documentation/red_hat_insights/'
};

class SideNav extends Component {
    render() {
        const { activeTechnology, activeLocation } = this.props;
        return (<Fragment>
            <Split className="ins-c-navigation__header">
                <SplitItem className="ins-c-page__home-icon">
                    <a href={`${ document.baseURI }`}>
                        <HomeIcon size="md" />
                    </a>
                </SplitItem>
                <SplitItem isMain className="pf-u-display-flex pf-u-align-items-center">
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
