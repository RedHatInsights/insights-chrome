import React from 'react';
import { Tooltip, Button } from '@patternfly/react-core';
import cookie from 'js-cookie';
//import '../../../sass/beta.scss';

export default class Beta extends React.Component {
    constructor() {
        super();
        this.state = {
            betaDefault: cookie.get('betaDefault')
        };
    }

    setBetaDefault = () => {
        cookie.set('betaDefault', true, { expires: 9999 });
        this.setState({ betaDefault: true });
    }

    goToStable() {
        event.preventDefault();
        cookie.remove('betaDefault');
        window.location = window.location.href.replace('/beta', '');
    }

    render() {
        if (window.location.href.includes('/beta')) {
            return (
                <div className={'ins-c-page__beta '}>
                    <span>
                        <i className='fas fa-flask'></i>
                        <Tooltip
                            content={
                                <div>
                                    This is a beta environment and contains Technology Preview
                                    features that are not supported by Red Hat production service-level
                                    agreements (SLAs) and might not be functionally complete. Red Hat
                                    recommends not using them for production.
                                </div>
                            }
                        >
                            <span>Insights & Cloud Management Services Beta.</span>
                        </Tooltip>
                    </span>
                    <a onClick={ this.goToStable } href={window.location.href.replace('/beta', '')}>Take me to Stable.</a>
                    {cookie.get('betaDefault') ? null :
                        <Button
                            variant="primary"
                            id="beta_button"
                            onClick={ this.setBetaDefault }>
                            Set as Default
                        </Button>
                    }
                </div>
            );
        } else {
            return null;
        }
    }
};
