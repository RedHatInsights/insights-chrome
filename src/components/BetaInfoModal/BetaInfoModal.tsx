import React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/js/icons/info-circle-icon';
import { Bullseye, Button, ButtonProps, Modal, ModalProps, ModalVariant, Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';

export type BetaInfoModalProps = {
  isOpen?: boolean;
  onClick: ButtonProps['onClick'];
  onCancel: ModalProps['onClose'];
  menuItemClicked?: string;
};
const BetaInfoModal = ({ isOpen, onClick, onCancel, menuItemClicked }: BetaInfoModalProps) => {
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

export default BetaInfoModal;
