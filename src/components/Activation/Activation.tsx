import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { getEnv } from '../../utils/common';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import InternalChromeContext from '../../utils/internalChromeContext';

const Activation = ({
  user,
  request,
}: {
  user: {
    username: string;
    accountNumber: string;
    email: string;
  };
  request: string;
}) => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const isAvailable = getEnv() === 'prod';
  const {
    auth: { getToken },
  } = useContext(InternalChromeContext);

  async function handleActivationRequest() {
    const token = await getToken();
    if (isAvailable) {
      fetch(`${window.origin}/api/platform-feedback/v1/issues`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Username: ${user.username}, Account ID: ${user.accountNumber}, Email: ${user.email}`,
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
    if (user) {
      handleActivationRequest();
    }
  }, []);

  return (
    <Modal isOpen={isModalOpen} onClose={onModalClose} title={intl.formatMessage(messages.activationTitle)} variant={ModalVariant.medium}>
      <Content>
        <Content component="p">{intl.formatMessage(messages.activationDescription)}</Content>
      </Content>
    </Modal>
  );
};

export default Activation;
