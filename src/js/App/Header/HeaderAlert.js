import React, { useState, useEffect } from 'react';
import { Alert } from '@patternfly/react-core/dist/js/components/Alert/Alert';
import { AlertActionCloseButton } from '@patternfly/react-core/dist/js/components/Alert/AlertActionCloseButton';
import PropTypes from 'prop-types';
import './Alert.scss';

const HeaderAlert = ({ title, variant, onAppear, dismissable, dismissDelay }) => {
  const [alertVisible, setAlertVisible] = useState(true);
  const [timer, setTimer] = useState(null);

  useEffect(() => createTimer(), []);

  useEffect(() => {
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const createTimer = () => {
    onAppear && onAppear();
    timer !== null && clearTimeout(timer);

    dismissable ||
      setTimer(
        setTimeout(() => {
          setAlertVisible(false);
          clearTimeout(timer);
        }, dismissDelay)
      );
  };

  return (
    <React.Fragment>
      {alertVisible && (
        <Alert
          variant={variant}
          title={title}
          className="ins-c-alert"
          actionClose={dismissable ? <AlertActionCloseButton onClose={() => setAlertVisible(false)} /> : null}
        />
      )}
    </React.Fragment>
  );
};

HeaderAlert.defaultProps = {
  variant: 'info',
  dismissable: false,
  dismissDelay: 8000,
};

HeaderAlert.propTypes = {
  title: PropTypes.string,
  variant: PropTypes.string,
  onAppear: PropTypes.func,
  dismissable: PropTypes.bool,
  dismissDelay: PropTypes.number,
};

export default HeaderAlert;
