import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Button } from '@patternfly/react-core';
import cookie from 'js-cookie';


const Beta = () => (
    <div className='ins-c-page__beta' style={{ display: window.location.href.includes('/beta') ? 'flex' : 'none' }}>
        <i className='fas fa-flask'></i>
        <Tooltip
            content={
                <div>This is a beta environment and contains Technology Preview
                 features that are not supported by Red Hat production service-level
                 agreements (SLAs) and might not be functionally complete. Red Hat
                 recommends not sing them for production. See fore information here.</div>
            }
        >
            <p>Insights & Cloud Management Services Beta.</p>
        </Tooltip>
        <p><a onClick={ goToStable }> Take me to Stable</a>.</p>
        <Button variant="primary" id="beta_button" className={{ display: cookie.get('betaDefault') ? 'none' : 'flex' }} onClick={ setBetaDefault }>
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
    document.getElementById("beta_button").style.display = 'none';
}

//export default Beta;
export default Beta;
