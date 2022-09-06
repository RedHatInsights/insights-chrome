import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  Panel,
  PanelMain,
  PanelMainBody,
  Text,
  TextArea,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { DeepRequired } from 'utility-types';
import { ChromeUser } from '@redhat-cloud-services/types';
import './Feedback.scss';
import PropTypes from 'prop-types';
import { getEnv, getUrl, isProd } from '../../utils';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

export type ReportBugProps = {
  user: DeepRequired<ChromeUser>;
  onCloseModal: () => void;
  onSubmit: () => void;
  onClickBack: () => void;
  handleFeedbackError: () => void;
};

const ReportBug = ({ user, onCloseModal, onSubmit, onClickBack, handleFeedbackError }: ReportBugProps) => {
  const [textAreaValue, setTextAreaValue] = useState('');
  const [checked, setChecked] = useState(false);
  const intl = useIntl();
  const env = getEnv();
  const app = getUrl('app');
  const bundle = getUrl('bundle');
  const isAvailable = env === 'prod' || env === 'stage';
  const addFeedbackTag = () => (isProd() ? `[${bundle}]` : '[PRE-PROD]');

  async function handleModalSubmission() {
    const token = await window.insights.chrome.auth.getToken();
    if (isAvailable) {
      try {
        const response = await fetch(`${window.origin}/api/platform-feedback/v1/issues`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: `Bug: ${textAreaValue}, Username: ${user.identity.user.username}, Account ID: ${user.identity.account_number}, 
          Email: ${checked ? user.identity.user.email : ''}, URL: ${window.location.href}`,
            summary: `${addFeedbackTag()} App Feedback`,
            labels: [app, bundle],
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result = response.json();
        onSubmit();
      } catch (err) {
        console.error(err);
        handleFeedbackError();
      }
    } else {
      console.log('Submitting feedback only works in prod and stage');
    }
  }

  return (
    <div className="chr-c-feedback-content">
      <TextContent>
        <Text component={TextVariants.h1}>{intl.formatMessage(messages.reportABug)}</Text>
        <Text>
          {intl.formatMessage(messages.describeReportBug)}{' '}
          <Text component="a" href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
            {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
          </Text>
        </Text>
      </TextContent>
      <Form>
        <FormGroup fieldId="horizontal-form-exp">
          <TextArea
            value={textAreaValue}
            onChange={(value) => setTextAreaValue(value)}
            className="chr-c-feedback-text-area"
            name="feedback-description-text"
            id="bug-report-description-text"
            placeholder={intl.formatMessage(messages.addDescription)}
          />
        </FormGroup>
        <FormGroup className="pf-u-mt-20">
          <Checkbox
            id="feedback-checkbox"
            isChecked={checked}
            onChange={() => setChecked(!checked)}
            label={intl.formatMessage(messages.researchOpportunities)}
            description={`${intl.formatMessage(messages.learnAboutResearchOpportunities)} ${intl.formatMessage(
              messages.weNeverSharePersonalInformation
            )}`}
          />
        </FormGroup>
      </Form>
      {checked ? (
        <>
          <div className="pf-u-font-family-heading-sans-serif chr-c-feedback-email">{intl.formatMessage(messages.email)}</div>
          <Panel variant="raised" className="chr-c-feedback-panel">
            <PanelMain>
              <PanelMainBody className="chr-c-feedback-panel__body">{user.identity.user.email}</PanelMainBody>
            </PanelMain>
          </Panel>
        </>
      ) : (
        ''
      )}
      <div className="chr-c-feedback-buttons">
        <Button
          ouiaId="submit-feedback"
          isDisabled={textAreaValue.length > 1 ? false : true}
          className="chr-c-feedback-footer-button"
          key="confirm"
          variant="primary"
          onClick={handleModalSubmission}
        >
          {intl.formatMessage(messages.submitFeedback)}
        </Button>
        <Button ouiaId="back-feedback" className="chr-c-feedback-footer-button" key="back" variant="secondary" onClick={onClickBack}>
          {intl.formatMessage(messages.back)}
        </Button>
        <Button ouiaId="cancel-feedback" className="chr-c-feedback-footer-button" key="cancel" variant="link" onClick={onCloseModal}>
          {intl.formatMessage(messages.cancel)}
        </Button>
      </div>
    </div>
  );
};

ReportBug.propTypes = {
  user: PropTypes.object,
  modalPage: PropTypes.string,
  setModalPage: PropTypes.func,
  onCloseModal: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default ReportBug;
