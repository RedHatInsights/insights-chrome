import React, { useState } from 'react';
import {
    Button,
    Modal, ModalVariant,
    Form, FormGroup,
    TextArea } from '@patternfly/react-core';
import { OutlinedCommentsIcon } from '@patternfly/react-icons';
import './Feedback.scss';
import * as Sentry from '@sentry/browser';

const Feedback = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [textAreaValue, setTextAreaValue] = useState('');

    const token = 'f869e10dc31347119bc8837cb85bcef490d9c65ee5554cac8fb334723871954e';
    const organization_slug = 'cloud-dot';
    const project_slug = 'insights';

    const handleModalSubmission = () => {
        console.log('Submitted feedback', textAreaValue);

        fetch(`https://sentry.io/api/0/projects/${organization_slug}/${project_slug}/user-feedback/`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comments: textAreaValue,
                event_id: '1',
                name: 'test tester',
                email: 'testing@testing.com'
            })
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(err => Sentry.captureException(err));
        
        setIsModalOpen(false);
    };
    
    return(
        <React.Fragment>
            <Button className='ins-c-button__feedback' onClick={() => setIsModalOpen(true)}>
                <OutlinedCommentsIcon/>
                Feedback
            </Button>
            <Button className='ins-c-button__feedback2' onClick={() => Sentry.showReportDialog()}>
                <OutlinedCommentsIcon/>
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
                </Button>
            ]}
            >
                <Form>
                    <FormGroup label="Please leave us your feedback for Red Hat Insights below" fieldId="horizontal-form-exp">
                        <TextArea
                            value={textAreaValue}
                            onChange={(value) => setTextAreaValue(value)}
                            name="feedback-description-text"
                            id="feedback-description-text"/>
                    </FormGroup>
                </Form>
            </Modal>
        </React.Fragment>
    );
};

export default Feedback;
