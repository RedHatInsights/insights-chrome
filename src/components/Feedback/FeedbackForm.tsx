import React, { ReactNode, useContext, useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Form, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Panel, PanelMain, PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';

import { DeepRequired } from 'utility-types';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useIntl } from 'react-intl';

import messages from '../../locales/Messages';
import { getEnv, isProd } from '../../utils/common';

import './Feedback.scss';
import { getUrl } from '../../hooks/useBundle';
import InternalChromeContext from '../../utils/internalChromeContext';

export type FeedbackFormProps = {
  user: DeepRequired<ChromeUser>;
  onCloseModal: () => void;
  onSubmit: () => void;
  onClickBack: () => void;
  handleFeedbackError: () => void;
  modalTitle: string;
  modalDescription?: string | ReactNode;
  textareaLabel?: string;
  feedbackType: 'Feedback' | 'Bug' | '[Research Opportunities]';
  checkboxDescription: string;
  textAreaHidden?: boolean;
  submitTitle: string;
};

const FeedbackForm = ({
  user,
  onCloseModal,
  onSubmit,
  onClickBack,
  handleFeedbackError,
  modalTitle,
  modalDescription,
  textareaLabel,
  feedbackType,
  checkboxDescription,
  textAreaHidden = false,
  submitTitle,
}: FeedbackFormProps) => {
  const intl = useIntl();
  const [textAreaValue, setTextAreaValue] = useState('');
  const [checked, setChecked] = useState(false);
  const env = getEnv();
  const app = getUrl('app');
  const bundle = getUrl('bundle');
  const isAvailable = env === 'prod' || env === 'stage';
  const addFeedbackTag = () => (isProd() ? `[${bundle}]` : '[PRE-PROD]');
  const {
    auth: { getToken },
  } = useContext(InternalChromeContext);

  async function handleModalSubmission() {
    const token = await getToken();
    if (isAvailable) {
      try {
        await fetch(`${window.origin}/api/platform-feedback/v1/issues`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: `${feedbackType} ${textAreaValue}, Username: ${user.identity.user.username}, Account ID: ${
              user.identity.account_number
            }, Email: ${checked ? user.identity.user.email : ''}, URL: ${window.location.href}`,
            summary: `${addFeedbackTag()} App Feedback`,
            labels: [app, bundle],
          }),
        }).then((response) => response.json());
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
      <Content>
        <Content component={ContentVariants.h1}>{modalTitle}</Content>
        {modalDescription}
      </Content>
      <Form>
        {textAreaHidden ? (
          ''
        ) : (
          <FormGroup label={textareaLabel} className="pf-v5-u-pt-md" fieldId="horizontal-form-exp">
            <TextArea
              value={textAreaValue}
              onChange={(_event, value) => setTextAreaValue(value)}
              name="feedback-description-text"
              id="feedback-description-text"
              autoResize
            />
          </FormGroup>
        )}
        <FormGroup className="pf-v6-u-mt-20">
          <Checkbox
            id="feedback-checkbox"
            isChecked={checked}
            onChange={() => setChecked(!checked)}
            label={intl.formatMessage(messages.researchOpportunities)}
            description={checkboxDescription}
          />
        </FormGroup>
      </Form>
      {checked ? (
        <>
          <div className="pf-v6-u-font-family-heading-sans-serif chr-c-feedback-email">{intl.formatMessage(messages.email)}</div>
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
          className="chr-c-feedback-footer-button"
          key="confirm"
          variant="primary"
          isDisabled={feedbackType !== '[Research Opportunities]' ? (textAreaValue.length > 1 ? false : true) : !checked}
          onClick={handleModalSubmission}
        >
          {submitTitle}
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

export default FeedbackForm;
