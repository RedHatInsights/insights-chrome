import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Button } from '@patternfly/react-core';
import cookie from 'js-cookie';

const Beta = () => (
    <div className={'ins-c-page__beta ' + (window.location.href.includes('/beta') ? '' : 'ins-c-page_beta-hidden')}>
        <i className='fas fa-flask'></i>
        <Tooltip
            content={
                <div>This is a beta environment and contains Technology Preview
                 features that are not supported by Red Hat production service-level
                 agreements (SLAs) and might not be functionally complete. Red Hat
                 recommends not using them for production. See fore information here.</div>
            }
        >
            <p>Insights & Cloud Management Services Beta.</p>
        </Tooltip>
        <p><a onClick={ goToStable }> Take me to Stable</a>.</p>
        <Button
            variant="primary" id="beta_button"
            className={(cookie.get('betaDefault') ? 'ins-c-button_hidden' : '')}
            onClick={ setBetaDefault }>
            Set as Default
        </Button>
    </div>
);

Beta.propTypes = {
    betaHidden: PropTypes.bool
};

function goToStable() {
    cookie.remove('betaDefault');
    window.location = window.location.href.replace('/beta', '');
}

function setBetaDefault() {
    cookie.set('betaDefault', true, { expires: 9999 });
    document.getElementById('beta_button').className += ' ins-c-button_hidden';
}

//export default Beta;
export default Beta;
