import React, { Fragment, Component } from 'react';
import Navigation from './Navigation';
import { Split, SplitItem } from '@patternfly/react-core/dist/esm/layouts/Split';
import HomeIcon from '@patternfly/react-icons/dist/esm/icons/home-icon';

class SideNav extends Component {

    render() {
        return (<Fragment>
            <Split className="ins-c-navigation__header">
                <SplitItem className="ins-c-page__home-icon">
                    <a href={`${ document.baseURI }platform/landing`}>
                        <HomeIcon size="md" />
                    </a>
                </SplitItem>
                <SplitItem isMain className="pf-u-display-flex pf-u-align-items-center">
                    {localStorage.getItem('cs-app-title') || `Applications`}
                </SplitItem>
            </Split>
            <Navigation />
        </Fragment>);
    }
}
export default SideNav;
