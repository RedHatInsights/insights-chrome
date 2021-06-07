import React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/js/icons/info-circle-icon';
import { Button, Bullseye, Modal, ModalVariant, Title } from '@patternfly/react-core';
import './Navigation.scss';

import PropTypes from 'prop-types';

const BetaInfoModal = ({ isOpen, onClick, onCancel, menuItemClicked }) => (
  <Modal aria-label="Beta info modal" isOpen={isOpen} onClose={onCancel} variant={ModalVariant.medium}>
    <Bullseye>
      <div className="ins-c-navigation__beta-info-modal">
        <InfoCircleIcon size="xl" className="info-icon" />
        <Title headingLevel="h4" size="xl">
          {`${menuItemClicked} is only available in our Beta Environment`}
        </Title>
        <div>
          Try this feature in our Beta Environment on cloud.redhat.com/beta. The Beta Environment allows you to interact with new features in an
          active development space. Because beta pre-release software is still being developed, you may encounter bugs or flaws in availability,
          stability, data, or performance.
        </div>
        <div>
          After you use a feature in beta, you’ll stay in the Beta Environment until you manually exit the beta release. Leave the Beta Environment
          any time by clicking on the settings (gear) icon or beta icon in the top toolbar.
        </div>
        <div className="pf-u-pt-md">
          <Button key="confirm" variant="primary" onClick={onClick}>
            Use feature in beta
          </Button>
        </div>
        <div>
          <a href="https://access.redhat.com/support/policy/updates/cloud-redhat/lifecycle">Learn more about Beta Environment</a>
        </div>
      </div>
    </Bullseye>
  </Modal>
);

BetaInfoModal.propTypes = {
  isOpen: PropTypes.bool,
  onClick: PropTypes.func,
  onCancel: PropTypes.func,
  menuItemClicked: PropTypes.string,
};

export default BetaInfoModal;
