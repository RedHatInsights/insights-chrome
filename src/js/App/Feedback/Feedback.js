import React, { useState } from 'react';
import { Alert, Button, Form, FormGroup, Label, Modal, ModalVariant, Text, TextArea, TextContent } from '@patternfly/react-core';
import { OutlinedCommentsIcon } from '@patternfly/react-icons';
import './Feedback.scss';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFeedbackModal } from '../../redux/actions';
import { isProd } from '../../utils.ts';

const Feedback = ({ user }) => {
  console.log('USER', user);
  const usePendoFeedback = useSelector(({ chrome: { usePendoFeedback } }) => usePendoFeedback);
  const isOpen = useSelector(({ chrome: { isFeedbackModalOpen } }) => isFeedbackModalOpen);
  const dispatch = useDispatch();
  const [textAreaValue, setTextAreaValue] = useState('');
  const env = window.insights.chrome.getEnvironment();
  const app = window.insights.chrome.getApp();
  const bundle = window.insights.chrome.getBundle();
  const isAvailable = env === 'prod' || env === 'stage';
  const setIsModalOpen = (...args) => dispatch(toggleFeedbackModal(...args));
  const addFeedbackTag = () => (isProd() ? `[${bundle}]` : '[PRE-PROD]');

  const handleModalSubmission = () => {
    if (isAvailable) {
      fetch(`${window.origin}/api/platform-feedback/v1/issues`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Feedback: ${textAreaValue}, Username: ${user.identity.user.username}, Account ID: ${user.identity.account_number}, Org ID: ${user.identity.org_id}, Email: ${user.identity.user.email}, URL: ${window.location.href}`, //eslint-disable-line
          summary: `${addFeedbackTag()} App Feedback`,
          labels: [app, bundle],
        }),
      }).then((response) => response.json());
    } else {
      console.log('Submitting feedback only works in prod and stage');
    }

    setIsModalOpen(false);
  };

  return (
    <React.Fragment>
      <Button
        ouiaId="feedback-button"
        className="chr-c-button-feedback"
        onClick={() => {
          if (!usePendoFeedback) {
            setIsModalOpen(true);
          }
        }}
      >
        <OutlinedCommentsIcon />
        Feedback
      </Button>
      <Modal
        title="We would love your feedback!"
        isOpen={isOpen}
        variant={ModalVariant.medium}
        onClose={() => setIsModalOpen(false)}
        actions={[
          <Button ouiaId="submit-feedback" key="confirm" variant="primary" onClick={handleModalSubmission}>
            Submit feedback
          </Button>,
          <Button ouiaId="cancel-feedback" key="cancel" variant="link" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
        ]}
      >
        <Form>
          <Alert variant="info" isInline title="This form is to share feedback about your experience.">
            <TextContent>
              <Text className="pf-u-mb-0">The feedback you share below helps us to improve the user experience.</Text>
              <Text>If you are experiencing an issue that requires support, open a support case instead.</Text>
              <Text component="a" href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
                Open a support case
              </Text>
            </TextContent>
          </Alert>
          <FormGroup label="Please leave us your feedback below." fieldId="horizontal-form-exp">
            <TextArea
              value={textAreaValue}
              onChange={(value) => setTextAreaValue(value)}
              name="feedback-description-text"
              id="feedback-description-text"
            />
          </FormGroup>
        </Form>
        {!isAvailable && <Label color="red"> Submitting feedback only works in prod and stage </Label>}
      </Modal>
    </React.Fragment>
  );
};

Feedback.propTypes = {
  user: PropTypes.object,
};

export default Feedback;
