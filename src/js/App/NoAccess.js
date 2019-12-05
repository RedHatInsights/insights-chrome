import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { spinUpStore } from '../redux-config';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components';

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
        <React.Fragment>
            <PageHeader>
                <PageHeaderTitle title={ `${ appName }` }/>
            </PageHeader>
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
        </React.Fragment>
    );
};

NoAccess.propTypes = {
    appName: PropTypes.string
};

const { store } = spinUpStore();
ReactDOM.render(
    <NoAccess />,
    document.getElementById('root')
);