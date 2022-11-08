import React from 'react';
import { Button, Text, TextContent, TextVariants } from '@patternfly/react-core';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import { useIntl } from 'react-intl';

import messages from '../../locales/Messages';

import './Feedback.scss';

export type FeedbackErrorProps = {
  onCloseModal: () => void;
};

const FeedbackError = ({ onCloseModal }: FeedbackErrorProps) => {
  const intl = useIntl();
  return (
    <div className="chr-c-feedback-success-content">
      <CheckIcon size="md" color="var(--pf-global--success-color--100)" className="pf-u-mx-auto" />
      <TextContent>
        <Text component={TextVariants.h1}>{intl.formatMessage(messages.somethingWentWrong)}</Text>
        <Text>
          {intl.formatMessage(messages.problemProcessingRequest)}{' '}
          <a target="_blank" href="https://access.redhat.com/support" rel="noreferrer">
            {intl.formatMessage(messages.redHatSupport)}
          </a>
        </Text>
      </TextContent>
      <Button variant="primary" onClick={onCloseModal}>
        {intl.formatMessage(messages.close)}
      </Button>
    </div>
  );
};

export default FeedbackError;
