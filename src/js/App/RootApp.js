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
                <main className="pf-c-page__main pf-l-page__main" id="root" role="main" />
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
