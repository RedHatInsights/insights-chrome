import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import CheckIcon from '@patternfly/react-icons/dist/dynamic/icons/check-icon';
import { useIntl } from 'react-intl';

import messages from '../../locales/Messages';

import './Feedback.scss';

export type FeedbackSuccessProps = {
  onCloseModal: () => void;
  successTitle: string;
  successDescription: string;
};

const FeedbackSuccess = ({ onCloseModal, successTitle, successDescription }: FeedbackSuccessProps) => {
  const intl = useIntl();
  return (
    <div className="chr-c-feedback-success-content">
      <Icon size="md">
        <CheckIcon color="var(--pf-t--global--icon--color--status--success--default))" className="pf-v6-u-mx-auto" />
      </Icon>
      <Content>
        <Content component={ContentVariants.h1}>{successTitle}</Content>
        <Content component="p">{successDescription}</Content>
      </Content>
      <Button variant="primary" onClick={onCloseModal}>
        {intl.formatMessage(messages.close)}
      </Button>
    </div>
  );
};

export default FeedbackSuccess;
