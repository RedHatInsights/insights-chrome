import React, { useState } from 'react';
import { Button, Modal, ModalVariant, Form, FormGroup, TextArea } from '@patternfly/react-core';
import { OutlinedCommentsIcon } from '@patternfly/react-icons';
import './Feedback.scss';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';

const Feedback = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState('');

  const handleModalSubmission = () => {
    const apiUrl = window.insights.isProd ? 'https://cloud.redhat.com' : `https://${window.insights.chrome.getEnvironment()}.cloud.redhat.com`;

    fetch(`${apiUrl}/api/feedback/issues`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `Feedback: ${textAreaValue} \
                              Username: ${user.identity.user.username} \
                              Account ID: ${user.identity.account_number} \
                              Email: ${user.identity.user.email} \
                              URL: ${window.location.href}`,
        summary: `${!window.insights.isProd && '[PRE-PROD]'} Insights Feedback`,
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log(data));

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
      </Modal>
    </React.Fragment>
  );
};

Feedback.propTypes = {
  user: PropTypes.object,
};

export default Feedback;
