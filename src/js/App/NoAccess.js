import React from 'react';
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
                    <Button variant="primary" component="a" onClick={ () => history.back() }>Return to previous page</Button> :
                    <Button variant="primary" component="a" href=".">Go to landing page</Button>
            }
        </EmptyState>
    );
};

NoAccess.propTypes = {
    activeAppTitle: PropTypes.string
};

function stateToProps({ chrome: { activeAppTitle } }) {
    console.log("From NoAccess", activeAppTitle);
    return ({ activeAppTitle });
}

export default connect(stateToProps, null)(NoAccess);
