import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { Split, SplitItem } from '@patternfly/react-core/dist/esm/layouts/Split';
import HomeIcon from '@patternfly/react-icons/dist/esm/icons/home-icon';
import { connect } from 'react-redux';

class SideNav extends Component {
    render() {
        const { activeTechnology } = this.props;
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
            <Navigation />
        </Fragment>);
    }
}

SideNav.propTypes = {
    activeTechnology: PropTypes.string
};

SideNav.defaultProps = {
    activeTechnology: ''
};

export default connect(({ chrome: { activeTechnology } }) => ({ activeTechnology }))(SideNav);
