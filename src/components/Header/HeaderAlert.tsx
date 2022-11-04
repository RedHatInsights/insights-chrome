import React, { useEffect, useState } from 'react';
import { Alert, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';
import './HeaderAlert.scss';

export type HeaderAlertProps = {
  title?: string;
  variant?: AlertVariant;
  onDismiss?: () => void;
  dismissable?: boolean;
  dismissDelay?: number;
};

const HeaderAlert = ({ title, variant = AlertVariant.info, onDismiss, dismissable = false, dismissDelay = 5000 }: HeaderAlertProps) => {
  const [alertVisible, setAlertVisible] = useState(true);
  const [timer, setTimer] = useState<NodeJS.Timer | null>(null);

  useEffect(() => {
    dismissable || createTimer();
    return () => {
      timer && clearTimeout(timer);
    };
  }, []);

  const createTimer = () => {
    timer !== null && clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        setAlertVisible(false);
        if (timer) {
          clearTimeout(timer);
        }
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
      {alertVisible && <Alert variant={variant} title={title} className="chr-c-alert" actionClose={<AlertActionCloseButton onClose={onClose} />} />}
    </React.Fragment>
  );
};

HeaderAlert.defaultProps = {
  variant: 'info',
  dismissable: false,
  dismissDelay: 5000,
};

export default HeaderAlert;
