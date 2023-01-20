import React, { memo, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Label,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, OutlinedCommentsIcon } from '@patternfly/react-icons';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { DeepRequired } from 'utility-types';

import feedbackIllo from '../../../static/images/feedback_illo.svg';
import FeedbackForm from './FeedbackForm';
import { toggleFeedbackModal } from '../../redux/actions';
import { ReduxState } from '../../redux/store';
import FeedbackSuccess from './FeedbackSuccess';
import messages from '../../locales/Messages';
import FeedbackError from './FeedbackError';

import './Feedback.scss';

export type FeedbackModalProps = {
  user: DeepRequired<ChromeUser>;
};

export type FeedbackPages =
  | 'feedbackHome'
  | 'feedbackOne'
  | 'feedbackSuccess'
  | 'reportBugOne'
  | 'informDirection'
  | 'feedbackError'
  | 'bugReportSuccess'
  | 'informDirectionSuccess';

const FeedbackModal = memo(({ user }: FeedbackModalProps) => {
  const intl = useIntl();
  const usePendoFeedback = useSelector<ReduxState, boolean | undefined>(({ chrome: { usePendoFeedback } }) => usePendoFeedback);
  const isOpen = useSelector<ReduxState, boolean | undefined>(({ chrome: { isFeedbackModalOpen } }) => isFeedbackModalOpen);
  const dispatch = useDispatch();
  const [modalPage, setModalPage] = useState<FeedbackPages>('feedbackHome');
  const env = window.insights.chrome.getEnvironment();
  const isAvailable = env === 'prod' || env === 'stage';
  const setIsModalOpen = (isOpen: boolean) => dispatch(toggleFeedbackModal(isOpen));
  const handleCloseModal = () => {
    setIsModalOpen(false), setModalPage('feedbackHome');
  };

  const ModalDescription = ({ modalPage }: { modalPage: FeedbackPages }) => {
    switch (modalPage) {
      case 'feedbackHome':
        return (
          <div className="chr-c-feedback-content">
            <TextContent>
              <Text component={TextVariants.h1}>{intl.formatMessage(messages.tellAboutExperience)}</Text>
              <Text>{intl.formatMessage(messages.helpUsImproveHCC)}</Text>
            </TextContent>
            <div className="chr-c-feedback-cards">
              <Card isSelectableRaised isCompact onClick={() => setModalPage('feedbackOne')}>
                <CardTitle className="chr-c-feedback-card-title">{intl.formatMessage(messages.shareFeedback)}</CardTitle>
                <CardBody>{intl.formatMessage(messages.howIsConsoleExperience)}</CardBody>
              </Card>
              <br />
              <Card isSelectableRaised isCompact onClick={() => setModalPage('reportBugOne')}>
                <CardTitle className="chr-c-feedback-card-title">{intl.formatMessage(messages.reportABug)}</CardTitle>
                <CardBody>{intl.formatMessage(messages.describeBugUrgentCases)}</CardBody>
              </Card>
              <br />
              <Card
                isSelectableRaised
                isCompact
                onClick={() => {
                  window.open('https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true', '_blank');
                }}
              >
                <CardTitle className="chr-c-feedback-card-title">
                  <Text>
                    {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
                  </Text>
                </CardTitle>
                <CardBody>{intl.formatMessage(messages.getSupport)}</CardBody>
              </Card>
              <br />
              <Card isSelectableRaised isCompact onClick={() => setModalPage('informDirection')}>
                <CardTitle className="chr-c-feedback-card-title">
                  <Text>{intl.formatMessage(messages.informRedhatDirection)}</Text>
                </CardTitle>
                <CardBody>{intl.formatMessage(messages.learnAboutResearchOpportunities)}</CardBody>
              </Card>
            </div>
            <Button className="chr-c-feedback-button" ouiaId="cancel-feedback" key="cancel" variant="link" onClick={handleCloseModal}>
              {intl.formatMessage(messages.cancel)}
            </Button>
          </div>
        );
      case 'feedbackOne':
        return (
          <FeedbackForm
            user={user}
            onCloseModal={handleCloseModal}
            onSubmit={() => setModalPage('feedbackSuccess')}
            onClickBack={() => setModalPage('feedbackHome')}
            handleFeedbackError={() => setModalPage('feedbackError')}
            modalTitle={intl.formatMessage(messages.shareYourFeedback)}
            textareaLabel={intl.formatMessage(messages.enterFeedback)}
            feedbackType="Feedback"
            checkboxDescription={intl.formatMessage(messages.learnAboutResearchOpportunities)}
            submitTitle={intl.formatMessage(messages.submitFeedback)}
          />
        );
      case 'reportBugOne':
        return (
          <FeedbackForm
            user={user}
            onCloseModal={handleCloseModal}
            onSubmit={() => setModalPage('bugReportSuccess')}
            onClickBack={() => setModalPage('feedbackHome')}
            handleFeedbackError={() => setModalPage('feedbackError')}
            modalTitle={intl.formatMessage(messages.reportABug)}
            modalDescription={
              <Text>
                {intl.formatMessage(messages.describeReportBug)}{' '}
                <Text component="a" href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
                  {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
                </Text>
              </Text>
            }
            feedbackType="Bug"
            checkboxDescription={`${intl.formatMessage(messages.learnAboutResearchOpportunities)} ${intl.formatMessage(
              messages.weNeverSharePersonalInformation
            )}`}
            submitTitle={intl.formatMessage(messages.submitFeedback)}
          />
        );
      case 'informDirection':
        return (
          <FeedbackForm
            user={user}
            onCloseModal={handleCloseModal}
            onSubmit={() => setModalPage('informDirectionSuccess')}
            onClickBack={() => setModalPage('feedbackHome')}
            handleFeedbackError={() => setModalPage('feedbackError')}
            modalTitle={intl.formatMessage(messages.informRedhatDirection)}
            modalDescription={
              <Text>
                {intl.formatMessage(messages.informDirectionDescription)}
                <Text component="a" href="https://www.redhat.com/en/about/user-research" target="_blank">
                  {intl.formatMessage(messages.userResearchTeam)}
                </Text>
                {intl.formatMessage(messages.directInfluence)}
              </Text>
            }
            feedbackType="[Research Opportunities]"
            textAreaHidden={true}
            checkboxDescription={intl.formatMessage(messages.weNeverSharePersonalInformation)}
            submitTitle={intl.formatMessage(messages.joinMailingList)}
          />
        );
      case 'feedbackSuccess':
        return (
          <FeedbackSuccess
            successTitle={intl.formatMessage(messages.feedbackSent)}
            successDescription={intl.formatMessage(messages.thankYouForFeedback)}
            onCloseModal={handleCloseModal}
          />
        );
      case 'bugReportSuccess':
        return (
          <FeedbackSuccess
            successTitle={intl.formatMessage(messages.bugReported)}
            successDescription={intl.formatMessage(messages.teamWillReviewBug)}
            onCloseModal={handleCloseModal}
          />
        );
      case 'informDirectionSuccess':
        return (
          <FeedbackSuccess
            successTitle={intl.formatMessage(messages.responseSent)}
            successDescription={intl.formatMessage(messages.thankYouForInterest)}
            onCloseModal={handleCloseModal}
          />
        );
      case 'feedbackError':
        return <FeedbackError onCloseModal={handleCloseModal} />;
    }
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
        {intl.formatMessage(messages.feedback)}
      </Button>
      <Modal aria-label="Feedback modal" isOpen={isOpen} className="chr-c-feedback-modal" variant={ModalVariant.large} onClose={handleCloseModal}>
        <Grid>
          <GridItem span={8} rowSpan={12}>
            <ModalDescription modalPage={modalPage} />
          </GridItem>
          <GridItem span={4} className="chr-c-feedback-image">
            <img alt="feedback illustration" src={feedbackIllo} />
          </GridItem>
        </Grid>
        {!isAvailable && <Label color="red"> {intl.formatMessage(messages.submitOnlyInStageProd)} </Label>}
      </Modal>
    </React.Fragment>
  );
});

FeedbackModal.displayName = 'FeedbackModal';

export default FeedbackModal;
