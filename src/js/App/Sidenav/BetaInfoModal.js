import React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/js/icons/info-circle-icon';
import { Bullseye, Button, Modal, ModalVariant, Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../locales/Messages';

import PropTypes from 'prop-types';

const BetaInfoModal = ({ isOpen, onClick, onCancel, menuItemClicked }) => {
  const intl = useIntl();
  return (
    <Modal aria-label="Beta info modal" isOpen={isOpen} onClose={onCancel} variant={ModalVariant.medium}>
      <Bullseye>
        <div className="chr-c-navigation__beta-info-modal">
          <InfoCircleIcon size="xl" className="info-icon" />
          <Title headingLevel="h4" size="xl">
            {`${menuItemClicked} is only available in our Beta Environment`}
          </Title>
          <div>{intl.formatMessage(messages.tryThisFeatureInBeta)}</div>
          <div>{intl.formatMessage(messages.afterBetaUse)}</div>
          <div className="pf-u-pt-md">
            <Button key="confirm" variant="primary" onClick={onClick}>
              {intl.formatMessage(messages.useFeatureInBeta)}
            </Button>
          </div>
          <div>
            <a href="https://access.redhat.com/support/policy/updates/cloud-redhat/lifecycle">{intl.formatMessage(messages.learnMoreABoutBeta)}</a>
          </div>
        </div>
      </Bullseye>
    </Modal>
  );
};

BetaInfoModal.propTypes = {
  isOpen: PropTypes.bool,
  onClick: PropTypes.func,
  onCancel: PropTypes.func,
  menuItemClicked: PropTypes.string,
};

export default BetaInfoModal;
