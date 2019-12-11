import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const RootApp = ({
    activeApp,
    activeLocation,
    appId,
    pageAction,
    pageObjectId
}) => {

    return (
        <Fragment>
            <div
                className="pf-c-drawer__content"
                ouia-page-type={activeApp || appId}
                ouia-page-group={activeLocation}
                {...pageAction && { 'ouia-page-action': pageAction }}
                {...pageObjectId && { 'ouia-page-object-id': pageObjectId }}
            >
                <main className="pf-c-page__main pf-l-page__main" id="root" role="main">
                    <section
                        className="pf-m-light pf-c-page-header pf-c-page__main-section pf-m-light"
                        widget-type="InsightsPageHeader"
                    >
                        <div className="pf-c-content">
                            <h1
                                className="pf-c-title pf-m-2xl ins-l-page__header--loading"
                                widget-type='InsightsPageHeaderTitle'
                            >
                                <div className="ins-c-skeleton ins-c-skeleton__sm">
                                    &nbsp;
                                </div>
                            </h1>
                        </div>
                    </section>
                    <section className="pf-c-page__main-section pf-l-page__main-section--loading">
                        <div className="ins-c-spinner ins-m-center" role="status">
                            <span className="pf-u-screen-reader">Loading...</span>
                        </div>
                    </section>
                </main>
                <main className="pf-c-page__main pf-l-page__main" id="no-access">
                    <section
                        className="pf-m-light pf-c-page-header pf-c-page__main-section pf-m-light"
                        widget-type="InsightsPageHeader"
                    >
                        <div className="pf-c-content">
                            <h1
                                className="pf-c-title pf-m-2xl ins-l-page__header"
                                widget-type='InsightsPageHeaderTitle'
                            >
                                <div className="appTitle">
                                    &nbsp;
                                </div>
                            </h1>
                        </div>
                    </section>
                    <section className="pf-c-page__no-access"></section>
                </main>

            </div>
            <aside className="pf-c-drawer__panel">
                <div className="pf-c-drawer__panel-body" />
            </aside>
        </Fragment>
    );
};

RootApp.propTypes = {
    appId: PropTypes.string,
    activeApp: PropTypes.string,
    activeLocation: PropTypes.string,
    pageAction: PropTypes.string,
    pageObjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId } }) {
    return ({ activeApp, activeLocation, appId, pageAction, pageObjectId });
}

export default connect(stateToProps, null)(RootApp);
