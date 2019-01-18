import React, { Component } from 'react';
import { AboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import logo from './logo.svg';
import { connect } from 'react-redux';

class InsightsAbout extends Component {
    constructor(props) {
        super(props);

        let app;
        if (this.props.globalNav) {
            app = this.props.globalNav.find(item => item.active);
            if (app.subItems) {
                const subApp = app.subItems.find(subItem => subItem.id === this.props.activeApp);
                app = subApp && subApp.reload ? subApp : app;
            }
        }

        this.state = {
            chromeVersion: "N/A",
            inventoryVersion: "N/A",
            remediationsVersion: "N/A",
            currentApp: app && app.title,
            currentAppVersion: "N/A"
        }
    }
    componentDidMount(){
        fetch('static/chrome/app.info.json')
        .then(response => response.json())
        .then(data => this.setState({ chromeVersion: data.travis.build_number }));

        fetch(`platform/inventory/app.info.json`)
        .then(response => response.json())
        .then(data => this.setState({ inventoryVersion: data.travis.build_number }));

        fetch(`platform/remediations/app.info.json`)
        .then(response => response.json())
        .then(data => this.setState({ remediationsVersion: data.travis.build_number }));

        fetch(`platform/${this.state.currentApp.toLowerCase()}/app.info.json`)
        .then(response => response.json())
        .then(data => this.setState({ currentAppVersion: data.travis.build_number }));
    }
    render() {
        const { isModalOpen, onClose, user, activeApp } = this.props;

        function getItem(term, details) {
            return <React.Fragment>
                <TextListItem component="dt">{term}:</TextListItem>
                <TextListItem component="dd">
                    {
                        (typeof details === 'function') ? details() : details
                    }
                </TextListItem>
            </React.Fragment>;
        }

        return (
            <AboutModal
                isOpen={isModalOpen}
                onClose={onClose}
                brandImageSrc={logo}
                brandImageAlt="Red Hat Insights Logo"
                heroImageSrc={`${document.baseURI}/static/chrome/assets/images/pfbg_2000.jpg`}
            >
              <p>
                Please include these details when opening a support case against Insights
              </p>
                <TextContent>
                    <TextList component="dl">
                      { getItem('User Name', user && user.username) }
                      { getItem('Current Application', this.state.currentApp) }
                      { getItem('Current Application Version', this.state.currentAppVersion) }
                      { getItem('Application Path', window.location.pathname) }
                      { getItem('Chrome Version', this.state.chromeVersion) }
                      { getItem('Inventory Version', this.state.inventoryVersion) }
                      { getItem('Remediations Version', this.state.remediationsVersion) }
                    </TextList>
                </TextContent>
            </AboutModal>
        );
    }
}

function mapStateToProps({ chrome: { user, appId, globalNav, activeApp } }) {
    return { appId, globalNav, user, activeApp };
}

export default connect(mapStateToProps)(InsightsAbout);
