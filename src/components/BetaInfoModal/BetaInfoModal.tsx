import React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/info-circle-icon';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Button, ButtonProps } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Modal, ModalProps, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';

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
        <div className="pf-v6-u-m-md pf-v6-u-text-align-center">
          <Icon size="xl" iconSize="xl" status="info" className="pf-v6-u-m-md">
            <InfoCircleIcon />
          </Icon>
          <TextContent>
            <Text component="h2">{`${menuItemClicked} is only available in our Preview Environment`}</Text>
            <Text component="p">{intl.formatMessage(messages.tryThisFeatureInBeta)}</Text>
            <Text component="p">{intl.formatMessage(messages.afterBetaUse)}</Text>
          </TextContent>
          <Button key="confirm" variant="primary" onClick={onClick} className="pf-v6-u-mt-md">
            {intl.formatMessage(messages.useFeatureInBeta)}
          </Button>
          <TextContent className="pf-v6-u-mt-md">
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
