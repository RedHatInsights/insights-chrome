import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
    Title,
    Button,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    EmptyStateBody
} from '@patternfly/react-core';

import { LockIcon } from '@patternfly/react-icons';

const NoAccess = ({ activeAppTitle }) => {
    return (
        <Fragment>
            <section
                className="pf-m-light pf-c-page-header pf-c-page__main-section pf-m-light"
                widget-type="InsightsPageHeader">
                <div className="pf-c-content">
                    <h1
                        className="pf-c-title pf-m-2xl ins-l-page__header"
                        widget-type='InsightsPageHeaderTitle'
                    >
                        <div className="apptitle">
                            { `${activeAppTitle}` }
                        </div>
                    </h1>
                </div>
            </section>
            <section className="pf-c-page__no-access">
                <EmptyState variant={ EmptyStateVariant.full }>
                    <EmptyStateIcon icon={ LockIcon } />
                    <Title headingLevel="h5" size="lg">
                        { `You do not have access to ${ activeAppTitle }` }
                    </Title>
                    <EmptyStateBody>
                        Contact your organization administrator(s) for more information.
                    </EmptyStateBody>
                    {
                        document.referrer ?
                            <Button variant="primary" onClick={ () => history.back() }>Return to previous page</Button> :
                            <Button variant="primary" component="a" href=".">Go to landing page</Button>
                    }
                </EmptyState>
            </section>
        </Fragment>
    );
};

NoAccess.propTypes = {
    activeAppTitle: PropTypes.string
};

function stateToProps({ chrome: { activeAppTitle } }) {
    return ({ activeAppTitle });
}

export default connect(stateToProps, null)(NoAccess);
