import React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import cookie from 'js-cookie';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { log } from 'util';

class LogoutAlert extends React.Component {
    constructor(props) {
        super(props);
        this.state = { alertOneVisible: cookie.get('justLoggedOut') === 'true' };
    }

    hideAlertOne = () => {
        this.setState({ alertOneVisible: false });
        cookie.set('justLoggedOut', 'false');
    }

    render() {
        const { alertOneVisible } = this.state;
        return (
            <React.Fragment>
                { alertOneVisible && (
                    <Alert
                        variant="success"
                        isInline={ true }
                        title="Congratualtions you have successfully logged out!"
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
