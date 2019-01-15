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
                productName="Red Hat Insights"
                brandImageSrc={logo}
                brandImageAlt="Red Hat Insights Logo"
                heroImageSrc={`${document.baseURI}/static/chrome/assets/images/pfbg_2000.jpg`}
            >
                <TextContent>
                    <TextList component="dl">
                        { getItem('Current Application', app && app.title) }
                        { getItem('User Name', user && user.username) }
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
