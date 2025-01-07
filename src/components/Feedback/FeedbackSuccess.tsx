import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
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
        <CheckIcon color="var(--pf-v5-global--success-color--100)" className="pf-v6-u-mx-auto" />
      </Icon>
      <TextContent>
        <Text component={TextVariants.h1}>{successTitle}</Text>
        <Text>{successDescription}</Text>
      </TextContent>
      <Button variant="primary" onClick={onCloseModal}>
        {intl.formatMessage(messages.close)}
      </Button>
    </div>
  );
};

export default FeedbackSuccess;
