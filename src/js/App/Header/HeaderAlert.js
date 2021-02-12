import React, { useState, useEffect } from 'react';
import { Alert } from '@patternfly/react-core/dist/js/components/Alert/Alert';
import { AlertActionCloseButton } from '@patternfly/react-core/dist/js/components/Alert/AlertActionCloseButton';
import PropTypes from 'prop-types';
import './HeaderAlert.scss';

const HeaderAlert = ({ title, variant, onDismiss, dismissable, dismissDelay }) => {
  const [alertVisible, setAlertVisible] = useState(true);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    dismissable || createTimer();
  }, []);

  useEffect(() => {
    return () => clearTimeout(timer);
  }, []);

  const createTimer = () => {
    timer !== null && clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        setAlertVisible(false);
        clearTimeout(timer);
        onDismiss && onDismiss();
      }, dismissDelay)
    );
  };

  const onClose = () => {
    onDismiss && onDismiss();
    setAlertVisible(false);
  };

  return (
    <React.Fragment>
      {alertVisible && <Alert variant={variant} title={title} className="ins-c-alert" actionClose={<AlertActionCloseButton onClose={onClose} />} />}
    </React.Fragment>
  );
};

HeaderAlert.defaultProps = {
  variant: 'info',
  dismissable: false,
  dismissDelay: 5000,
};

HeaderAlert.propTypes = {
  title: PropTypes.string,
  variant: PropTypes.string,
  onDismiss: PropTypes.func,
  dismissable: PropTypes.bool,
  dismissDelay: PropTypes.number,
};

export default HeaderAlert;
