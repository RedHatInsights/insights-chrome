import React, { Component } from 'react';
import {
    AboutModal,
    TextContent, TextList, TextListItem,
    Level, LevelItem,
    Stack, StackItem
} from '@patternfly/react-core';
import logo from '../../../../static/images/rh-logo-white.svg';
import { connect } from 'react-redux';
import './InsightsAbout.scss';

const Copyright = () => (
    <React.Fragment>
        <div>Copyright © 2019 Red Hat, Inc.</div>
        <Level>
            <LevelItem>
                <a class="nav-link"
                    href="https://www.redhat.com/en/about/privacy-policy"
                    target="_blank"
                >
                    Privacy Policy
                </a>
            </LevelItem>
            <LevelItem>
                <a class="nav-link"
                    href="https://access.redhat.com/help/terms"
                    target="_blank"
                >
                    Customer Portal Terms of Use
                </a>
            </LevelItem>
            <LevelItem>
                <a class="nav-link"
                    href="https://www.redhat.com/en/about/all-policies-guidelines"
                    target="_blank"
                >
                    All Policies and Guidelines
                </a>
            </LevelItem>
        </Level>
    </React.Fragment>
);

class InsightsAbout extends Component {
    constructor(props) {
        super(props);

        let app;
        if (this.props.globalNav) {
            app = this.props.globalNav.find(item => item.active);
            if (app && app.subItems) {
                const subApp = app.subItems.find(subItem => subItem.id === this.props.activeApp);
                app = subApp && subApp.reload ? subApp : app;
            }
        }

        this.state = {
            appDetails: { apps: [
                { name: 'Chrome', path: 'apps/chrome/app.info.json', version: 'N/A' },
                { name: 'Dashboard', path: `apps/dashboard/app.info.json`, version: 'N/A' },
                { name: 'Inventory', path: `apps/inventory/app.info.json`, version: 'N/A' },
                { name: 'Remediations', path: `apps/remediations/app.info.json`, version: 'N/A' },
                { name: 'Vulnerabilities', path: 'apps/vulnerability/app.info.json', version: 'N/A' },
                { name: 'Compliance', path: 'apps/compliance/app.info.json', version: 'N/A' },
                { name: 'Cost Management', path: 'apps/cost-management/app.info.json', version: 'N/A' },
                { name: 'Insights', path: 'apps/advisor/app.info.json', version: 'N/A' }
            ] },
            currentApp: app && app.title
        };
        this.updateAppVersion = this.updateAppVersion.bind(this);
    }

    getItem(term, details) {
        return <React.Fragment>
            <TextListItem component="dt">{term}:</TextListItem>
            <TextListItem component="dd">
                {
                    (typeof details === 'function') ? details() : details
                }
            </TextListItem>
        </React.Fragment>;
    }

    updateAppVersion(app, version, buildId) {
        const { appDetails } = this.state;
        let currentApp = appDetails.apps.find(appDetail => appDetail.name === app.name);

        if (currentApp) {
            if (buildId) {
                version = `${version}.${buildId}`;
            }

            currentApp.version = version;
        }

        this.setState(appDetails);
    }

    componentDidMount() {
        this.state.appDetails.apps.forEach((app) => {
            fetch(app.path)
            .then(response => response.json())
            .catch(() => ({ travis: {} }))
            .then(data => this.updateAppVersion(app, data.src_hash, data.build_id));
        });
    }

    render() {
        const { isModalOpen, onClose, user } = this.props;

        return (
            <AboutModal
                isOpen={isModalOpen}
                onClose={onClose}
                brandImageSrc={logo}
                productName="Red Hat Cloud Services"
                brandImageAlt="Red Hat Logo"
                trademark={<Copyright />}
            >
                <Stack gutter='sm'>
                    <StackItem>
                        Please include these details when opening a support case against Insights
                    </StackItem>
                    <StackItem>
                        <TextContent className="ins-c-page__about--modal">
                            <TextList component="dl" className='ins-debug-info'>
                                {this.getItem('User Name', user && user.username)}
                                {this.getItem('Current Application', this.state.currentApp)}
                                {this.getItem('Application Path', window.location.pathname)}
                                {this.state.appDetails.apps.map((app) => {
                                    return this.getItem(app.name + ' Version', app.version);
                                })}
                            </TextList>
                        </TextContent>
                    </StackItem>
                </Stack>
            </AboutModal>
        );
    }
}

function mapStateToProps({ chrome: { user: { identity: { user } }, appId, globalNav, activeApp } }) {
    return { appId, globalNav, user, activeApp };
}

export default connect(mapStateToProps)(InsightsAbout);
