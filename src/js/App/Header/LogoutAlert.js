import React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import cookie from 'js-cookie';

class LogoutAlert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alertOneVisible: cookie.get('cs_loggedOut') === 'true',
            delay: 5000
        };
    }

    hideAlertOne = () => {
        this.setState({ alertOneVisible: false });
        cookie.set('cs_loggedOut', 'false');
    }
    componentDidMount() {
        this.setTimer();
    }

    setTimer = () => {
        if (this._timer !== null) {
            clearTimeout(this._timer);
        }

        // hide after `delay` milliseconds
        this._timer = setTimeout(function() {
            this.setState({ alertOneVisible: false });
            this._timer = null;
        }.bind(this), this.state.delay);
    }

    render() {
        const { alertOneVisible } = this.state;
        return (
            <React.Fragment>
                { alertOneVisible && (
                    <Alert
                        variant="success"
                        title="You have successfully logged out."
                        className="ins-c-alert__logout"
                        action={ <AlertActionCloseButton onClose={ this.hideAlertOne } /> }
                    >
                    </Alert>
                ) }
            </React.Fragment>
        );
    }
}

export default LogoutAlert;
