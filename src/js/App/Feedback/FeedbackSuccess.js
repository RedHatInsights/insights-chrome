import React from 'react';
import { Button, Text, TextContent, TextVariants } from '@patternfly/react-core';
import './Feedback.scss';
import PropTypes from 'prop-types';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';

const FeedbackSuccess = ({ onCloseModal }) => {
  return (
    <div className="chr-c-feedback-success-content">
      <CheckIcon size="md" color="var(--pf-global--success-color--100)" className="pf-u-mx-auto" />
      <TextContent>
        <Text component={TextVariants.h1}>Feedback Sent</Text>
        <Text>Thank you, we appreciate your feedback.</Text>
      </TextContent>
      <Button variant="primary" onClick={onCloseModal}>
        Close
      </Button>
    </div>
  );
};

FeedbackSuccess.propTypes = {
  onCloseModal: PropTypes.func,
};

export default FeedbackSuccess;
