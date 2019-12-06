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
    return (
        <div>
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
        </div>
    );
};

NoAccess.propTypes = {
    appName: PropTypes.string
};

// ReactDOM.render(
//     <NoAccess/>,
//     document.querySelector('.pf-c-content')
// );
export default connect()(NoAccess);