import React from 'react';
import { Button } from '@patternfly/react-core/dist/js/components/Button/Button';

import Cookies from 'js-cookie';

export const CreateCase = () => {

    console.log(Cookies.get('cs_jwt'));

    const getSession = () => {
        fetch('https://access.qa.redhat.com/hydra/rest/se/sessions', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: 'Basic cmhuLXN1cHBvcnQtZGtvdWw6cmVkaGF0',
                // Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session: {
                    createdBy: 'test',
                    userAgent: 'cloud.redhat.com'
                },
                sessionDetails: {
                    createdBy: 'test'
                }
            })
        })
        .then(response => response.json());
        // .then(data => data && window.open(`https://access.qa.redhat.com/support/cases/${data.session.id}`));
    };

    return (
        <Button onClick={() => getSession()}> Create support case </Button>
    );
};
