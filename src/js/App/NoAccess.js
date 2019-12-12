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

const NoAccess = ({ appName }) => {
    appName = appName.charAt(0).toUpperCase() + appName.slice(1);
    const headerClass = document.querySelector('.apptitle');
    headerClass.innerHTML = appName;
    return (
        <EmptyState variant={ EmptyStateVariant.full }>
            <EmptyStateIcon icon={ LockIcon } />
            <Title headingLevel="h5" size="lg">
                { `You do not have access to ${ appName }` }
            </Title>
            <EmptyStateBody>
                Contact your organization administrator(s) for more information.
            </EmptyStateBody>
            {
                document.referrer ?
                    <Button variant="primary" onClick={ () => history.back() }>Return to previous page</Button> :
                    <Button variant="primary" onClick={ () => window.location.replace('/') }>Go to landing page</Button>
            }
        </EmptyState>
    );
};

NoAccess.propTypes = {
    appName: PropTypes.string
};

export default connect()(NoAccess);
