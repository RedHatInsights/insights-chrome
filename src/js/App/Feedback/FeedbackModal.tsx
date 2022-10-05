import React, { useState } from 'react';
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

import feedbackIllo from '../../../../static/images/feedback_illo.svg';
import Feedback from './Feedback';
import { toggleFeedbackModal } from '../../../redux/actions';
import { ReduxState } from '../../../redux/store';
import FeedbackSuccess from './FeedbackSuccess';
import messages from '../../Messages';

import './Feedback.scss';

export type FeedbackModalProps = {
  user: DeepRequired<ChromeUser>;
};

export type FeedbackPages = 'feedbackHome' | 'feedbackOne' | 'feedbackSuccess';

const FeedbackModal = ({ user }: FeedbackModalProps) => {
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
                <CardBody>{`${intl.formatMessage(messages.tellAboutExperience)} ${intl.formatMessage(messages.orShareIdeas)}`}</CardBody>
              </Card>
              <br />
              {/*  Add when bug report is ready
            <Card isSelectableRaised isCompact onClick={() => setModalPage('bugReport1')}>
              <CardTitle className="chr-c-feedback-card-title">{intl.formatMessage(messages.reportBug)}</CardTitle>
              <CardBody>{intl.formatMessage(messages.describeBug)}</CardBody>
            </Card>
            <br /> */}
              <Card isSelectableRaised isCompact href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
                <CardTitle className="chr-c-feedback-card-title">
                  <Text component="a" href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
                    {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
                  </Text>
                </CardTitle>
                <CardBody>{intl.formatMessage(messages.getSupport)}</CardBody>
              </Card>
            </div>
            <Button className="chr-c-feedback-button" ouiaId="cancel-feedback" key="cancel" variant="link" onClick={handleCloseModal}>
              {intl.formatMessage(messages.cancel)}
            </Button>
          </div>
        );
      case 'feedbackOne':
        return <Feedback user={user} onCloseModal={handleCloseModal} onSubmit={() => setModalPage('feedbackSuccess')} />;
      case 'feedbackSuccess':
        return <FeedbackSuccess onCloseModal={handleCloseModal} />;
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
      <Modal aria-label="Feedback modal" isOpen={isOpen} className="chr-c-feedback-modal" variant={ModalVariant.medium} onClose={handleCloseModal}>
        <Grid>
          <GridItem span={8} rowSpan={12}>
            <ModalDescription modalPage={modalPage} />
          </GridItem>
          <GridItem span={4} className="chr-c-feedback-image">
            <img className="chr-c-feedback-image" src={feedbackIllo} />
          </GridItem>
        </Grid>
        {!isAvailable && <Label color="red"> {intl.formatMessage(messages.submitOnlyInStageProd)} </Label>}
      </Modal>
    </React.Fragment>
  );
};

export default FeedbackModal;
