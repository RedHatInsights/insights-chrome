import React, { useEffect, useState } from 'react';
import { ChromeUser } from '@redhat-cloud-services/types';
import { DeepRequired } from 'utility-types';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import { getEnv } from '../../utils/common';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';

const Activation = ({ user, request }: { user: DeepRequired<ChromeUser>; request: string }) => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const isAvailable = getEnv() === 'prod';

  async function handleActivationRequest() {
    const token = await window.insights.chrome.auth.getToken();
    if (isAvailable) {
      fetch(`${window.origin}/api/platform-feedback/v1/issues`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Username: ${user.identity.user.username}, Account ID: ${user.identity.account_number}, Email: ${user.identity.user.email}`, //eslint-disable-line
          summary: `Activation Request - for cloud-marketplace-enablement team`,
          labels: [request],
        }),
      });
      console.log('Activation request sent');
    } else {
      console.log('You must be in prod to request activation');
    }
  }

  const onModalClose = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  useEffect(() => {
    user && handleActivationRequest();
  }, []);

  return (
    <Modal isOpen={isModalOpen} onClose={onModalClose} title={intl.formatMessage(messages.activationTitle)} variant={ModalVariant.medium}>
      <TextContent>
        <Text>{intl.formatMessage(messages.activationDescription)}</Text>
      </TextContent>
    </Modal>
  );
};

export default Activation;
