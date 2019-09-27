// import React from 'react';
// import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { onToggle } from '../../redux/actions';

// class LogoutAlert extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = { alertOneVisible: true };
//     }

//     visibleAlertOne = () => this.setState({ alertOneVisible: true });
//     hideAlertOne = () => this.setState({ alertOneVisible: false });

//     render() {
//         const { alertOneVisible } = this.state;
//         return (
//             <React.Fragment>
//                 { alertOneVisible && (
//                     <Alert
//                         variant="success"
//                         isInline={ true }
//                         title="Congratualtions you have successfully logged out!"
//                         action={ <AlertActionCloseButton onClose={ this.hideAlertOne } /> }
//                     >
//                     </Alert>
//                 ) }
//             </React.Fragment>
//         );
//     }
// }

// const LogoutAlert = ({})

// export default LogoutAlert;
