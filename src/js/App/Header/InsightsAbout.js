import React, { Component } from 'react';
import { AboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import logo from './logo.svg';
import { connect } from 'react-redux';

class InsightsAbout extends Component {
    render() {
        const { isModalOpen, onClose, user, globalNav, activeApp } = this.props;

        let app;
        if (globalNav) {
            app = globalNav.find(item => item.active);
            if (app.subItems) {
                const subApp = app.subItems.find(subItem => subItem.id === activeApp);
                app = subApp && subApp.reload ? subApp : app;
            }
        }

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
                      { getItem('Current Application', app && app.title) }
                      { getItem('Application Path', window.location.pathname) }
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
