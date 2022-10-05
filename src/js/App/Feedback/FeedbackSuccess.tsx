import React from 'react';
import { Button, Text, TextContent, TextVariants } from '@patternfly/react-core';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import { useIntl } from 'react-intl';

import messages from '../../../locales/Messages';

import './Feedback.scss';

export type FeedbackSuccessProps = {
  onCloseModal: () => void;
};

const FeedbackSuccess = ({ onCloseModal }: FeedbackSuccessProps) => {
  const intl = useIntl();
  return (
    <div className="chr-c-feedback-success-content">
      <CheckIcon size="md" color="var(--pf-global--success-color--100)" className="pf-u-mx-auto" />
      <TextContent>
        <Text component={TextVariants.h1}>{intl.formatMessage(messages.feedbackSent)}</Text>
        <Text>{intl.formatMessage(messages.thankYouForFeedback)}</Text>
      </TextContent>
      <Button variant="primary" onClick={onCloseModal}>
        {intl.formatMessage(messages.close)}
      </Button>
    </div>
  );
};

export default FeedbackSuccess;
