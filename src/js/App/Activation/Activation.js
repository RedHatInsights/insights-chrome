import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal, ModalVariant } from '@patternfly/react-core';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import { getEnv } from '../../utils';

const Activation = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const history = useHistory();
  const isAvailable = getEnv() === 'prod';

  const handleActivationRequest = () => {
    if (isAvailable) {
      fetch(`${window.origin}/api/platform-feedback/v1/issues`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Username: ${user.identity.user.username}, Account ID: ${user.identity.account_number}, Email: ${user.identity.user.email}, Send to rbernlei@redhat.com`, //eslint-disable-line
          summary: `Activation Request - assign to rbernlei@redhat.com`,
          labels: 'activation-request',
        }),
      });
      console.log('Activation request sent');
    } else {
      console.log('You must be in prod to request activation');
    }
  };

  const onModalClose = () => {
    setIsModalOpen(false);
    history.push('/');
  };

  useEffect(() => {
    user && handleActivationRequest();
  }, []);

  return (
    <Modal title="Thank you for submitting your activation request" isOpen={isModalOpen} variant={ModalVariant.medium} onClose={onModalClose}>
      {' '}
      Red Hat will be in touch with you shortly to confirm your subscription benefits are ready to use
    </Modal>
  );
};

Activation.propTypes = {
  user: PropTypes.object,
};

export default Activation;
