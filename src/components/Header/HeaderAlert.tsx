import React, { useEffect, useState } from 'react';
import { Alert, AlertActionCloseButton, AlertProps, AlertVariant } from '@patternfly/react-core/dist/dynamic/components/Alert';
import './HeaderAlert.scss';
import classNames from 'classnames';

export interface HeaderAlertProps extends AlertProps {
  variant?: AlertVariant;
  onDismiss?: () => void;
  dismissable?: boolean;
  dismissDelay?: number;
}

const HeaderAlert = ({
  className,
  title,
  variant = AlertVariant.info,
  actionLinks,
  onDismiss,
  dismissable = false,
  dismissDelay = 5000,
}: HeaderAlertProps) => {
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
    if (timer) {
      clearTimeout(timer);
    }
  };

  return (
    <React.Fragment>
      {alertVisible && (
        <Alert
          variant={variant}
          title={title}
          actionLinks={actionLinks}
          className={classNames('chr-c-alert', className)}
          actionClose={<AlertActionCloseButton onClose={onClose} />}
        />
      )}
    </React.Fragment>
  );
};

HeaderAlert.defaultProps = {
  variant: 'info',
  dismissable: false,
  dismissDelay: 5000,
};

export default HeaderAlert;
