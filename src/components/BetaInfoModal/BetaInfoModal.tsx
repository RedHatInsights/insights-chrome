import React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/js/icons/info-circle-icon';
import { Bullseye, Button, ButtonProps, Icon, Modal, ModalProps, ModalVariant, Text, TextContent } from '@patternfly/react-core';
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
        <div className="pf-u-m-md pf-u-text-align-center">
          <Icon size="xl" iconSize="xl" status="info" className="pf-u-m-md">
            <InfoCircleIcon />
          </Icon>
          <TextContent>
            <Text component="h2">{`${menuItemClicked} is only available in our Beta Environment`}</Text>
            <Text component="p">{intl.formatMessage(messages.tryThisFeatureInBeta)}</Text>
            <Text component="p">{intl.formatMessage(messages.afterBetaUse)}</Text>
          </TextContent>
          <Button key="confirm" variant="primary" onClick={onClick} className="pf-u-mt-md">
            {intl.formatMessage(messages.useFeatureInBeta)}
          </Button>
          <TextContent className="pf-u-mt-md">
            <Text component="a" href="https://access.redhat.com/support/policy/updates/cloud-redhat/lifecycle">
              {intl.formatMessage(messages.learnMoreABoutBeta)}
            </Text>
          </TextContent>
        </div>
      </Bullseye>
    </Modal>
  );
};

export default BetaInfoModal;
