import React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import cookie from 'js-cookie';

class LogoutAlert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alertOneVisible: cookie.get('justLoggedOut') === 'true',
            delay: 5000
        };
    }

    hideAlertOne = () => {
        this.setState({ alertOneVisible: false });
        cookie.set('justLoggedOut', 'false');
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
                        title="Congratualtions you have successfully logged out!"
                        className="ins-c-alert__logout"
                        action={ <AlertActionCloseButton onClose={ this.hideAlertOne } /> }
                    >
                    </Alert>
                ) }
            </React.Fragment>
        );
    }
}

// const LogoutAlert = ({ alertHidden }) => (
//     <div className="SOMETHING">
//         <div hidden={alertHidden} className="SOMETHING">
//             <Alert
//                 variant='success'
//                 title='Congratulation you have successfully logged out!'
//                 action={ <AlertActionCloseButton onClose={ this.hideAlertOne } /> }
//             />
//         </div>
//     </div>
// );

// LogoutAlert.PropTypes = {
//     alertHidden: PropTypes.bool
// };

// export default connect(({ chrome: { alertHidden } }) => ({ alertHidden }))(LogoutAlert);

export default LogoutAlert;
