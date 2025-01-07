import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import CheckIcon from '@patternfly/react-icons/dist/dynamic/icons/check-icon';
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
      <Icon size="md">
        <CheckIcon color="var(--pf-t--global--icon--color--status--success--default)" className="pf-v6-u-mx-auto" />
      </Icon>
      <Content>
        <Content component={ContentVariants.h1}>{intl.formatMessage(messages.somethingWentWrong)}</Content>
        <Content component="p">
          {intl.formatMessage(messages.problemProcessingRequest)}{' '}
          <a target="_blank" href="https://access.redhat.com/support/cases/#/case/new/get-support?caseCreate=true&source=console" rel="noreferrer">
            {intl.formatMessage(messages.redHatSupport)}
          </a>
        </Content>
      </Content>
      <Button variant="primary" onClick={onCloseModal}>
        {intl.formatMessage(messages.close)}
      </Button>
    </div>
  );
};

export default FeedbackError;
