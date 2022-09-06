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
import feedbackIllo from '../../../../static/images/feedback_illo.svg';
import Feedback from './Feedback';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFeedbackModal } from '../../redux/actions';
import FeedbackSuccess from './FeedbackSuccess';
import './Feedback.scss';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const FeedbackModal = ({ user }) => {
  const intl = useIntl();
  const usePendoFeedback = useSelector(({ chrome: { usePendoFeedback } }) => usePendoFeedback);
  const isOpen = useSelector(({ chrome: { isFeedbackModalOpen } }) => isFeedbackModalOpen);
  const dispatch = useDispatch();
  const [modalPage, setModalPage] = useState('feedbackHome');
  const env = window.insights.chrome.getEnvironment();
  const isAvailable = env === 'prod' || env === 'stage';
  const setIsModalOpen = (...args) => dispatch(toggleFeedbackModal(...args));
  const handleCloseModal = () => {
    setIsModalOpen(false), setModalPage('feedbackHome');
  };

  const ModalDescription = ({ modalPage }) => {
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

  ModalDescription.propTypes = {
    modalPage: PropTypes.string,
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
      <Modal isOpen={isOpen} className="chr-c-feedback-modal" variant={ModalVariant.medium} onClose={handleCloseModal}>
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

FeedbackModal.propTypes = {
  user: PropTypes.object,
};

export default FeedbackModal;
