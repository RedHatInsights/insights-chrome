import React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import WrenchIcon from '@patternfly/react-icons/dist/dynamic/icons/wrench-icon';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

const BetaInfoModal = ({ onAccept, isOpen, toggleOpen }: { toggleOpen: (isOpen: boolean) => void; isOpen: boolean; onAccept: () => void }) => {
  const Header = () => (
    <Title headingLevel="h1" size="2xl">
      Preview{' '}
      <Label>
        <WrenchIcon />
      </Label>
    </Title>
  );
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => toggleOpen(false)}
      variant={ModalVariant.small}
      header={<Header />}
      actions={[
        <Button key="enable-preview" variant="primary" type="button" onClick={onAccept}>
          Turn on
        </Button>,
        <Button key="cancel" variant="link" type="button" onClick={() => toggleOpen(false)}>
          Cancel
        </Button>,
      ]}
    >
      <TextContent>
        <Text>
          You can enable Preview mode to try out upcoming features that are in technology preview.{' '}
          <a href="https://access.redhat.com/support/policy/updates/hybridcloud-console/lifecycle" target="_blank" rel="noreferrer">
            Learn more
          </a>
          .
        </Text>
      </TextContent>
    </Modal>
  );
};

export default BetaInfoModal;
