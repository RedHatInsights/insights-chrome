import React, { memo, useContext, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card, CardBody, CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Grid, GridItem } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';

import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import OutlinedCommentsIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-comments-icon';
import { DeepRequired } from 'utility-types';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useIntl } from 'react-intl';
import { isFeedbackModalOpenAtom, usePendoFeedbackAtom } from '../../state/atoms/feedbackModalAtom';

import feedbackIllo from '../../../static/images/feedback_illo.svg';
import FeedbackForm from './FeedbackForm';
import FeedbackSuccess from './FeedbackSuccess';
import messages from '../../locales/Messages';
import FeedbackError from './FeedbackError';

import InternalChromeContext from '../../utils/internalChromeContext';
import { createSupportCase } from '../../utils/createCase';
import './Feedback.scss';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useSegment } from '../../analytics/useSegment';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import useSupportCaseData from '../../hooks/useSupportCaseData';

const FEEDBACK_OPEN_EVENT = 'chrome.feedback.open';

export type FeedbackPages =
  | 'feedbackHome'
  | 'feedbackOne'
  | 'feedbackSuccess'
  | 'reportBugOne'
  | 'informDirection'
  | 'feedbackError'
  | 'bugReportSuccess'
  | 'informDirectionSuccess';

const FeedbackModal = memo(() => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useAtom(isFeedbackModalOpenAtom);
  const usePendoFeedback = useAtomValue(usePendoFeedbackAtom);
  const [modalPage, setModalPage] = useState<FeedbackPages>('feedbackHome');
  const { getEnvironment } = useContext(InternalChromeContext);
  const chromeAuth = useContext(ChromeAuthContext);
  const { analytics } = useSegment();
  const user = chromeAuth.user as DeepRequired<ChromeUser>;
  const env = getEnvironment();
  const isAvailable = env === 'prod' || env === 'stage';
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalPage('feedbackHome');
  };
  const isPreview = useAtomValue(isPreviewAtom);
  const supportCaseData = useSupportCaseData();

  const ModalDescription = ({ modalPage }: { modalPage: FeedbackPages }) => {
    switch (modalPage) {
      case 'feedbackHome':
        return (
          <div className="chr-c-feedback-content">
            <FlexItem className="pf-v6-u-flex-grow-1">
              <Content className="pf-v6-u-mb-md">
                <Content component={ContentVariants.h1}>{intl.formatMessage(messages.tellAboutExperience)}</Content>
                <Content component="p">{intl.formatMessage(messages.helpUsImproveHCC)}</Content>
              </Content>
              <Card className="pf-v6-u-mb-lg" isCompact onClick={() => setModalPage('feedbackOne')}>
                <CardTitle className="pf-v6-u-primary-color-100">{intl.formatMessage(messages.shareFeedback)}</CardTitle>
                <CardBody>{intl.formatMessage(messages.howIsConsoleExperience)}</CardBody>
              </Card>
              <Card className="pf-v6-u-mb-lg" isCompact onClick={() => setModalPage('reportBugOne')}>
                <CardTitle className="pf-v6-u-primary-color-100">{intl.formatMessage(messages.reportABug)}</CardTitle>
                <CardBody>{intl.formatMessage(messages.describeBugUrgentCases)}</CardBody>
              </Card>
              <Card className="pf-v6-u-mb-lg" isCompact onClick={() => createSupportCase(user.identity, chromeAuth.token, isPreview, { supportCaseData })}>
                <CardTitle className="pf-v6-u-primary-color-100">
                  <Content component="p">
                    {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
                  </Content>
                </CardTitle>
                <CardBody>{intl.formatMessage(messages.getSupport)}</CardBody>
              </Card>
              <Card className="pf-v6-u-mb-lg" isCompact onClick={() => setModalPage('informDirection')}>
                <CardTitle className="pf-v6-u-primary-color-100">
                  <Content component="p">{intl.formatMessage(messages.informRedhatDirection)}</Content>
                </CardTitle>
                <CardBody>{intl.formatMessage(messages.learnAboutResearchOpportunities)}</CardBody>
              </Card>
            </FlexItem>
            <FlexItem>
              <Button className="chr-c-feedback-button" ouiaId="cancel-feedback" key="cancel" variant="link" onClick={handleCloseModal}>
                {intl.formatMessage(messages.cancel)}
              </Button>
            </FlexItem>
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
              <Content component="p">
                {intl.formatMessage(messages.describeReportBug)}{' '}
                <Content component="a" href="https://access.redhat.com/support/cases/#/case/new/get-support?caseCreate=true&source=console" target="_blank">
                  {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
                </Content>
              </Content>
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
              <Content component="p">
                {intl.formatMessage(messages.informDirectionDescription)}&nbsp;
                <Content component="a" href="https://www.redhat.com/en/about/user-research" target="_blank">
                  {intl.formatMessage(messages.userResearchTeam)}
                </Content>
                {intl.formatMessage(messages.directInfluence)}
              </Content>
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
        icon={<OutlinedCommentsIcon />}
        ouiaId="feedback-button"
        className="chr-c-button-feedback"
        onClick={() => {
          if (!usePendoFeedback) {
            analytics?.track(FEEDBACK_OPEN_EVENT);
            setIsModalOpen(true);
          }
        }}
      >
        {intl.formatMessage(messages.feedback)}
      </Button>
      <Modal aria-label="Feedback modal" isOpen={isModalOpen} className="chr-c-feedback-modal" variant={ModalVariant.large} onClose={handleCloseModal}>
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
