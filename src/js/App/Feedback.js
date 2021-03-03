import React, { useState } from 'react';
import { Button, Modal, ModalVariant, Form, FormGroup, TextArea, Label } from '@patternfly/react-core';
import { OutlinedCommentsIcon } from '@patternfly/react-icons';
import './Feedback.scss';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';

// This only works in prod and stage (api limitation)

const Feedback = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState('');
  const env = window.insights.chrome.getEnvironment();
  const isAvailable = (env === 'prod' || env === 'stage');

  const handleModalSubmission = () => {

    if(isAvailable) {
      fetch(`${window.origin}/api/platform-feedback/v1/issues`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Feedback: ${textAreaValue}, Username: ${user.identity.user.username}, Account ID: ${user.identity.account_number}, Email: ${user.identity.user.email}, URL: ${window.location.href}`, //eslint-disable-line
          summary: `${!window.insights.isProd && '[PRE-PROD]'} Insights Feedback`,
        }),
      })
      .then((response) => response.json());
    } else {
      console.log('This actually only works in prod and stage');
    }

    setIsModalOpen(false);
  };

  return (
    <React.Fragment>
      <Button className="ins-c-button__feedback" onClick={() => setIsModalOpen(true)}>
        <OutlinedCommentsIcon />
        Feedback
      </Button>
      <Modal
        title="We would love your feedback!"
        isOpen={isModalOpen}
        variant={ModalVariant.medium}
        onClose={() => setIsModalOpen(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={handleModalSubmission}>
            Submit feedback
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
        ]}
      >
        <Form>
          <FormGroup label="Please leave us your feedback for Red Hat Insights below" fieldId="horizontal-form-exp">
            <TextArea
              value={textAreaValue}
              onChange={(value) => setTextAreaValue(value)}
              name="feedback-description-text"
              id="feedback-description-text"
            />
          </FormGroup>
        </Form>
        { !isAvailable &&
          <Label color="red"> Submitting feedback currently works in prod and stage </Label>
        }
      </Modal>
    </React.Fragment>
  );
};

Feedback.propTypes = {
  user: PropTypes.object,
};

export default Feedback;
