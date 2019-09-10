import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from '@patternfly/react-core/dist/esm/components/Button';
import cookie from 'js-cookie';

const Beta = () => (
    <div className="ins-c-page__beta" style={{display: !window.location.href.includes("/beta") ? "none" : "flex"}}>
        <p>Insights & Cloud Management Services Beta. <a onClick={ goToStable }> Take me to Stable</a>.</p>
        <Button variant="primary" onClick={ setBetaDefault }> Set as Default </Button>
    </div>
);

Beta.propTypes = {
    betaHidden: PropTypes.bool
};

function goToStable() {
    cookie.remove('betaDefault');
    window.location = window.location.href.replace("/beta","");
}

function setBetaDefault() {
    cookie.set('betaDefault',true, { expires: 9999 });
}

//export default Beta;
export default Beta;
