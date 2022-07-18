import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import { getEnv } from '../../utils';

const Activation = ({ user, request }) => {
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
          labels: [request],
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
    <Modal isOpen={isModalOpen} onClose={onModalClose} title="Thank you for submitting your activation request" variant={ModalVariant.medium}>
      <TextContent>
        <Text>Red Hat will be in touch within 1 business day to confirm your subscription benefits are ready to be activated.</Text>
      </TextContent>
    </Modal>
  );
};

Activation.propTypes = {
  user: PropTypes.object,
  request: PropTypes.string,
};

export default Activation;
