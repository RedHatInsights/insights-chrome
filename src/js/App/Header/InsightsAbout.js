import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { AboutModal } from '@patternfly/react-core/dist/js/components/AboutModal/AboutModal';
import { Button } from '@patternfly/react-core/dist/js/components/Button/Button';
import { Tooltip } from '@patternfly/react-core/dist/js/components/Tooltip/Tooltip';
import { TextContent } from '@patternfly/react-core/dist/js/components/Text/TextContent';
import { TextList } from '@patternfly/react-core/dist/js/components/Text/TextList';
import { TextListItem } from '@patternfly/react-core/dist/js/components/Text/TextListItem';
import { Stack } from '@patternfly/react-core/dist/js/layouts/Stack/Stack';
import { StackItem } from '@patternfly/react-core/dist/js/layouts/Stack/StackItem';

import CopyIcon from '@patternfly/react-icons/dist/js/icons/copy-icon';

import logo from '../../../../static/images/logo.svg';
import { connect } from 'react-redux';
import './InsightsAbout.scss';
import * as Sentry from '@sentry/browser';

export const Copyright = () => (
  <div className="ins-c-footer__traditional-nav ins-c-page__about--modal-footer">
    <p className="copyright">Copyright © 2020 Red Hat, Inc.</p>
    <nav>
      <ul>
        <li>
          <a className="nav-link" href="https://www.redhat.com/en/about/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </li>
        <li>
          <a className="nav-link" href="https://access.redhat.com/help/terms/" target="_blank" rel="noopener noreferrer">
            Terms of Use
          </a>
        </li>
        <li>
          <a className="nav-link" href="https://www.redhat.com/en/about/all-policies-guidelines" target="_blank" rel="noopener noreferrer">
            All Policies and Guidelines
          </a>
        </li>
      </ul>
    </nav>
  </div>
);

export class InsightsAbout extends Component {
  constructor(props) {
    super(props);

    let app;
    if (this.props.globalNav) {
      app = this.props.globalNav.find((item) => item.active);
      if (app && app.subItems) {
        const subApp = app.subItems.find((subItem) => subItem.id === this.props.activeApp);
        app = subApp && subApp.reload ? subApp : app;
      }
    }

    this.state = {
      appDetails: {
        apps: [
          { name: 'Chrome', path: 'apps/chrome/app.info.json', version: 'N/A' },
          { name: 'Dashboard', path: `apps/dashboard/app.info.json`, version: 'N/A' },
          { name: 'Inventory', path: `apps/inventory/app.info.json`, version: 'N/A' },
          { name: 'Remediations', path: `apps/remediations/app.info.json`, version: 'N/A' },
          { name: 'Vulnerability', path: 'apps/vulnerability/app.info.json', version: 'N/A' },
          { name: 'Compliance', path: 'apps/compliance/app.info.json', version: 'N/A' },
          { name: 'Cost Management', path: 'apps/cost-management/app.info.json', version: 'N/A' },
          { name: 'Advisor', path: 'apps/advisor/app.info.json', version: 'N/A' },
          { name: 'Drift', path: 'apps/drift/app.info.json', version: 'N/A' },
          { name: 'Migration Analytics', path: 'apps/migration-analytics/app.info.json', version: 'N/A' },
          { name: 'Automation Hub', path: 'apps/automation-hub/app.info.json', version: 'N/A' },
          { name: 'Automation Analytics', path: 'apps/automation-analytics/app.info.json', version: 'N/A' },
          { name: 'Policies', path: 'apps/policies/app.info.json', version: 'N/A' },
          { name: 'Patch', path: 'apps/patch/app.info.json', version: 'N/A' },
          { name: 'Automation Services Catalog', path: 'apps/catalog/app.info.json', version: 'N/A' },
          { name: 'Approval', path: 'apps/approval/app.info.json', version: 'N/A' },
          { name: 'Sources', path: 'apps/sources/app.info.json', version: 'N/A' },
        ],
      },
      showCopyAlert: false,
      showCopyAlertError: false,
      currentApp: app && app.title,
    };
    this.hideCopyAlert = () => this.setState({ showCopyAlert: false });
    this.updateAppVersion = this.updateAppVersion.bind(this);
  }

  getItem(term, details) {
    return (
      <React.Fragment key={term}>
        <TextListItem component="dt">{term}:</TextListItem>
        <TextListItem component="dd">{typeof details === 'function' ? details() : details}</TextListItem>
      </React.Fragment>
    );
  }

  updateAppVersion(app, version, buildId) {
    const { appDetails } = this.state;
    let currentApp = appDetails.apps.find((appDetail) => appDetail.name === app.name);

    if (currentApp) {
      if (buildId) {
        version = `${version}.${buildId}`;
      }

      currentApp.version = version;
    }

    this.setState(appDetails);
  }

  copyDetails(username) {
    const debugDetails = {
      Username: username,
      CurrentApp: this.state.currentApp || 'Landing',
      ApplicationPath: window.location.pathname,
      ...this.state.appDetails,
    };

    // If the text is successfully copied, change the tooltip
    // The tooltip exit delay is 1000ms, but the fade out is 200ms
    // Set the timeout to 1200 so the text doesn't change while it is fading
    navigator.clipboard.writeText(JSON.stringify(debugDetails, null, 2)).then(
      () => {
        this.setState({ showCopyAlert: true }, () => {
          setTimeout(() => {
            this.setState({ showCopyAlert: false });
          }, 1200);
        });
      },
      (err) => {
        Sentry.captureException(err);
      }
    );
  }

  componentDidMount() {
    this.state.appDetails.apps.forEach((app) => {
      fetch(app.path)
        .then((response) => response.json())
        .catch(() => ({ travis: {} }))
        .then((data) => this.updateAppVersion(app, data.src_hash, data.build_id));
    });
  }

  render() {
    const { isModalOpen, onClose, user } = this.props;
    const { showCopyAlert } = this.state;

    return (
      <AboutModal isOpen={isModalOpen} onClose={onClose} brandImageSrc={logo} brandImageAlt="Red Hat Logo" className="ins-c-about-modal">
        <Stack gutter="sm">
          <StackItem>
            Please include these details when opening a support case.
            <Tooltip
              trigger="mouseenter focus click"
              position="top"
              content={showCopyAlert ? <span> Successfully copied to clipboard</span> : <span> Copy to clipboard </span>}
              entryDelay={100}
              exitDelay={1000}
            >
              <Button variant="plain" onClick={() => this.copyDetails(user.username)} aria-label="Copy details">
                <CopyIcon />
              </Button>
            </Tooltip>
          </StackItem>
          <StackItem>
            <TextContent className="ins-c-page__about--modal">
              <TextList component="dl" className="ins-debug-info">
                {this.getItem('User Name', user && user.username)}
                {this.getItem('Current Application', this.state.currentApp || 'Landing')}
                {this.getItem('Application Path', window.location.pathname)}
                {this.state.appDetails.apps.map((app) => {
                  return this.getItem(app.name + ' Version', app.version);
                })}
              </TextList>
            </TextContent>
          </StackItem>
          <StackItem>
            <Copyright />
          </StackItem>
        </Stack>
      </AboutModal>
    );
  }
}

InsightsAbout.propTypes = {
  globalNav: PropTypes.any,
  activeApp: PropTypes.string,
  isModalOpen: PropTypes.bool,
  onClose: PropTypes.func,
  user: PropTypes.object,
};

function mapStateToProps({
  chrome: {
    user: {
      identity: { user },
    },
    appId,
    globalNav,
    activeApp,
  },
}) {
  return { appId, globalNav, user, activeApp };
}

export default connect(mapStateToProps)(InsightsAbout);
