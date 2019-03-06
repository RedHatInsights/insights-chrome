import React, { Fragment, Component } from 'react';
import Navigation from './Navigation';
import { Split, SplitItem } from '@patternfly/react-core/dist/esm/layouts/Split';
import HomeIcon from '@patternfly/react-icons/dist/esm/icons/home-icon';

class SideNav extends Component {
    onHomeButtonClick() {
        window.location.href = `${document.baseURI}platform/landing`;
    }

    render() {
        return (<Fragment>
            <Split className="ins-c-navigation__header">
                <SplitItem onClick={this.onHomeButtonClick}><HomeIcon size="md" /></SplitItem>
                <SplitItem isMain>{localStorage.getItem('cs-app-title') || `Legacy`}</SplitItem>
            </Split>
            <Navigation />
        </Fragment>);
    }
}
export default SideNav;
