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

const FeedbackModal = ({ user }) => {
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
              <Text component={TextVariants.h1}>Tell us about your experience</Text>
              <Text>Help us improve the Red Hat Hybrid Cloud Console.</Text>
            </TextContent>
            <div className="chr-c-feedback-cards">
              <Card isSelectableRaised isCompact onClick={() => setModalPage('feedbackOne')}>
                <CardTitle className="chr-c-feedback-card-title">Share feedback</CardTitle>
                <CardBody>Tell us about your experience or share your ideas.</CardBody>
              </Card>
              <br />
              {/*  Add when bug report is ready
            <Card isSelectableRaised isCompact onClick={() => setModalPage('bugReport1')}>
              <CardTitle className="chr-c-feedback-card-title">Report a bug</CardTitle>
              <CardBody>Describe the bug you encountered. For urgent issues, open a support case instead.</CardBody>
            </Card>
            <br /> */}
              <Card isSelectableRaised isCompact href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
                <CardTitle className="chr-c-feedback-card-title">
                  <Text component="a" href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
                    Open a support case <ExternalLinkAltIcon />
                  </Text>
                </CardTitle>
                <CardBody>Get help from Red Hat support.</CardBody>
              </Card>
            </div>
            <Button className="chr-c-feedback-button" ouiaId="cancel-feedback" key="cancel" variant="link" onClick={handleCloseModal}>
              Cancel
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
        Feedback
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
        {!isAvailable && <Label color="red"> Submitting feedback only works in prod and stage </Label>}
      </Modal>
    </React.Fragment>
  );
};

FeedbackModal.propTypes = {
  user: PropTypes.object,
};

export default FeedbackModal;
