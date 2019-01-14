import React, { Component } from 'react';
import { AboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import logo from './logo.svg';
import { connect } from 'react-redux';

class InsightsAbout extends Component {
    render() {
        const { isModalOpen, onClose, user, globalNav, activeApp, appId } = this.props;
        console.log(appId, activeApp);
        let app;
        if (globalNav) {
            app = globalNav.find(
                item => item.active
            );
            if (app.subItems) {
                const subApp = app.subItems.find(subItem => subItem.id === activeApp);
                app = subApp && subApp.reload ? subApp : app;
            }
        }
        return (
            <AboutModal
                isOpen={isModalOpen}
                onClose={onClose}
                productName="Redhat Insights"
                brandImageSrc={logo}
                brandImageAlt="Red Hat Insights Logo"
                heroImageSrc={`${document.baseURI}/static/chrome/assets/images//pfbg_2000.jpg`}
            >
                <TextContent>
                    <TextList component="dl">
                        {/* <TextListItem component="dt">Chrome version:</TextListItem>
                        <TextListItem component="dd">TOBEDONE</TextListItem>
                        <TextListItem component="dt">Frontend components version:</TextListItem>
                        <TextListItem component="dd">TOBEDONE</TextListItem> */}
                        <TextListItem component="dt">Current application:</TextListItem>
                        <TextListItem component="dd">{app && app.title}</TextListItem>
                        <TextListItem component="dt">User Name:</TextListItem>
                        <TextListItem component="dd">{user && user.username}</TextListItem>
                        {/* <TextListItem component="dt">Browser Version:</TextListItem>
                        <TextListItem component="dd">TOBEDONE</TextListItem>
                        <TextListItem component="dt">Browser OS:</TextListItem>
                        <TextListItem component="dd">TOBEDONE</TextListItem> */}
                    </TextList>
                </TextContent>
            </AboutModal>
        )
    }
}

function mapStateToProps({ chrome: { user, appId, globalNav, activeApp } }) {
    return { appId, globalNav, user, activeApp };
}

export default connect(mapStateToProps)(InsightsAbout);
