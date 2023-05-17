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
import { toggleFeedbackModal } from '../../redux/actions';
import { ReduxState } from '../../redux/store';
import messages from '../../locales/Messages';
import { FeedbackModal as PFFeedbackModal } from '@patternfly/react-user-feedback';
import { isProd } from '../../utils/common';
import './Feedback.scss';
import { getUrl } from '../../hooks/useBundle';
export type FeedbackModalProps = {
  user: DeepRequired<ChromeUser>;
};

const app = getUrl('app');
const bundle = getUrl('bundle');

const FeedbackModal = memo(({ user }: FeedbackModalProps) => {
  const intl = useIntl();
  const feedbackLocale = {
    getSupport: intl.formatMessage(messages.getSupport),
    back: intl.formatMessage(messages.back),
    bugReported: intl.formatMessage(messages.bugReported),
    cancel: intl.formatMessage(messages.cancel),
    close: intl.formatMessage(messages.close),
    describeBug: intl.formatMessage(messages.describeBug),
    describeBugUrgentCases: intl.formatMessage(messages.describeBugUrgentCases),
    describeReportBug: intl.formatMessage(messages.describeReportBug),
    directInfluence: intl.formatMessage(messages.directInfluence),
    email: intl.formatMessage(messages.email),
    enterFeedback: intl.formatMessage(messages.enterFeedback),
    feedback: intl.formatMessage(messages.feedback),
    feedbackSent: intl.formatMessage(messages.feedbackSent),
    helpUsImproveHCC: intl.formatMessage(messages.helpUsImproveHCC),
    howIsConsoleExperience: intl.formatMessage(messages.howIsConsoleExperience),
    joinMailingList: intl.formatMessage(messages.joinMailingList),
    informDirectionDescription: intl.formatMessage(messages.informDirectionDescription),
    informDirection: intl.formatMessage(messages.informRedhatDirection),
    learnAboutResearchOpportunities: intl.formatMessage(messages.learnAboutResearchOpportunities),
    openSupportCase: intl.formatMessage(messages.openSupportCase),
    problemProcessingRequest: intl.formatMessage(messages.problemProcessingRequest),
    support: intl.formatMessage(messages.redHatSupport),
    reportABug: intl.formatMessage(messages.reportABug),
    responseSent: intl.formatMessage(messages.responseSent),
    researchOpportunities: intl.formatMessage(messages.researchOpportunities),
    shareFeedback: intl.formatMessage(messages.shareFeedback),
    shareYourFeedback: intl.formatMessage(messages.shareYourFeedback),
    somethingWentWrong: intl.formatMessage(messages.somethingWentWrong),
    submitFeedback: intl.formatMessage(messages.submitFeedback),
    teamWillReviewBug: intl.formatMessage(messages.teamWillReviewBug),
    tellAboutExperience: intl.formatMessage(messages.tellAboutExperience),
    thankYouForFeedback: intl.formatMessage(messages.thankYouForFeedback),
    thankYouForInterest: intl.formatMessage(messages.thankYouForInterest),
    userResearchTeam: intl.formatMessage(messages.userResearchTeam),
    weNeverSharePersonalInformation: intl.formatMessage(messages.weNeverSharePersonalInformation),
  };

  type feedbackType = 'Feedback' | 'Bug' | '[Research Opportunities]';
  const addFeedbackTag = () => (isProd() ? `[${bundle}]` : '[PRE-PROD]');
  async function handleModalSubmission(feedbackType: feedbackType, textAreaValue: string, checked?: boolean) {
    const token = await window.insights.chrome.auth.getToken();
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
            description: `${feedbackType} ${textAreaValue}, Username: ${user.identity.user.username}, Account ID: ${user.identity.account_number
              }, Email: ${checked ? user.identity.user.email : ''}, URL: ${window.location.href}`, //eslint-disable-line
            summary: `${addFeedbackTag()} App Feedback`,
            labels: [app, bundle],
          }),
        }).then((response) => response.json());
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    } else {
      console.log('Submitting feedback only works in prod and stage');
      return false;
    }
  }

  const usePendoFeedback = useSelector<ReduxState, boolean | undefined>(({ chrome: { usePendoFeedback } }) => usePendoFeedback);
  const isOpen = useSelector<ReduxState, boolean | undefined>(({ chrome: { isFeedbackModalOpen } }) => isFeedbackModalOpen);
  const dispatch = useDispatch();
  const env = window.insights.chrome.getEnvironment();
  const isAvailable = env === 'prod' || env === 'stage';
  const setIsModalOpen = (isOpen: boolean) => dispatch(toggleFeedbackModal(isOpen));

  // const ModalDescription = ({ modalPage }: { modalPage: FeedbackPages }) => {
  //   switch (modalPage) {
  //     case 'feedbackHome':
  //       return (
  //         <div className="chr-c-feedback-content">
  //           <TextContent>
  //             <Text component={TextVariants.h1}>{intl.formatMessage(messages.tellAboutExperience)}</Text>
  //             <Text>{intl.formatMessage(messages.helpUsImproveHCC)}</Text>
  //           </TextContent>
  //           <div className="chr-c-feedback-cards">
  //             <Card isSelectableRaised isCompact onClick={() => setModalPage('feedbackOne')}>
  //               <CardTitle className="chr-c-feedback-card-title">{intl.formatMessage(messages.shareFeedback)}</CardTitle>
  //               <CardBody>{intl.formatMessage(messages.howIsConsoleExperience)}</CardBody>
  //             </Card>
  //             <br />
  //             <Card isSelectableRaised isCompact onClick={() => setModalPage('reportBugOne')}>
  //               <CardTitle className="chr-c-feedback-card-title">{intl.formatMessage(messages.reportABug)}</CardTitle>
  //               <CardBody>{intl.formatMessage(messages.describeBugUrgentCases)}</CardBody>
  //             </Card>
  //             <br />
  //             <Card
  //               isSelectableRaised
  //               isCompact
  //             >
  //               <CardTitle className="chr-c-feedback-card-title">
  //                 <Text>
  //                   {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
  //                 </Text>
  //               </CardTitle>
  //               <CardBody>{intl.formatMessage(messages.getSupport)}</CardBody>
  //             </Card>
  //             <br />
  //             <Card isSelectableRaised isCompact onClick={() => setModalPage('informDirection')}>
  //               <CardTitle className="chr-c-feedback-card-title">
  //                 <Text>{intl.formatMessage(messages.informRedhatDirection)}</Text>
  //               </CardTitle>
  //               <CardBody>{intl.formatMessage(messages.learnAboutResearchOpportunities)}</CardBody>
  //             </Card>
  //           </div>
  //           <Button className="chr-c-feedback-button" ouiaId="cancel-feedback" key="cancel" variant="link" onClick={handleCloseModal}>
  //             {intl.formatMessage(messages.cancel)}
  //           </Button>
  //         </div>
  //       );
  //     case 'feedbackOne':
  //       return (
  //         <FeedbackForm
  //           user={user}
  //           onCloseModal={handleCloseModal}
  //           onSubmit={() => setModalPage('feedbackSuccess')}
  //           onClickBack={() => setModalPage('feedbackHome')}
  //           handleFeedbackError={() => setModalPage('feedbackError')}
  //           modalTitle={intl.formatMessage(messages.shareYourFeedback)}
  //           textareaLabel={intl.formatMessage(messages.enterFeedback)}
  //           feedbackType="Feedback"
  //           checkboxDescription={intl.formatMessage(messages.learnAboutResearchOpportunities)}
  //           submitTitle={intl.formatMessage(messages.submitFeedback)}
  //         />
  //       );
  //     case 'reportBugOne':
  //       return (
  //         <FeedbackForm
  //           user={user}
  //           onCloseModal={handleCloseModal}
  //           onSubmit={() => setModalPage('bugReportSuccess')}
  //           onClickBack={() => setModalPage('feedbackHome')}
  //           handleFeedbackError={() => setModalPage('feedbackError')}
  //           modalTitle={intl.formatMessage(messages.reportABug)}
  //           modalDescription={
  //             <Text>
  //               {intl.formatMessage(messages.describeReportBug)}{' '}
  //               <Text component="a" href="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true" target="_blank">
  //                 {intl.formatMessage(messages.openSupportCase)} <ExternalLinkAltIcon />
  //               </Text>
  //             </Text>
  //           }
  //           feedbackType="Bug"
  //           checkboxDescription={`${intl.formatMessage(messages.learnAboutResearchOpportunities)} ${intl.formatMessage(
  //             messages.weNeverSharePersonalInformation
  //           )}`}
  //           submitTitle={intl.formatMessage(messages.submitFeedback)}
  //         />
  //       );
  //     case 'informDirection':
  //       return (
  //         <FeedbackForm
  //           user={user}
  //           onCloseModal={handleCloseModal}
  //           onSubmit={() => setModalPage('informDirectionSuccess')}
  //           onClickBack={() => setModalPage('feedbackHome')}
  //           handleFeedbackError={() => setModalPage('feedbackError')}
  //           modalTitle={intl.formatMessage(messages.informRedhatDirection)}
  //           modalDescription={
  //             <Text>
  //               {intl.formatMessage(messages.informDirectionDescription)}
  //               <Text component="a" href="https://www.redhat.com/en/about/user-research" target="_blank">
  //                 {intl.formatMessage(messages.userResearchTeam)}
  //               </Text>
  //               {intl.formatMessage(messages.directInfluence)}
  //             </Text>
  //           }
  //           feedbackType="[Research Opportunities]"
  //           textAreaHidden={true}
  //           checkboxDescription={intl.formatMessage(messages.weNeverSharePersonalInformation)}
  //           submitTitle={intl.formatMessage(messages.joinMailingList)}
  //         />
  //       );
  //     case 'feedbackSuccess':
  //       return (
  //         <FeedbackSuccess
  //           successTitle={intl.formatMessage(messages.feedbackSent)}
  //           successDescription={intl.formatMessage(messages.thankYouForFeedback)}
  //           onCloseModal={handleCloseModal}
  //         />
  //       );
  //     case 'bugReportSuccess':
  //       return (
  //         <FeedbackSuccess
  //           successTitle={intl.formatMessage(messages.bugReported)}
  //           successDescription={intl.formatMessage(messages.teamWillReviewBug)}
  //           onCloseModal={handleCloseModal}
  //         />
  //       );
  //     case 'informDirectionSuccess':
  //       return (
  //         <FeedbackSuccess
  //           s
  //           onCloseModal={handleCloseModal}
  //         />
  //       );
  //     case 'feedbackError':
  //       return <FeedbackError onCloseModal={handleCloseModal} />;
  //   }
  // };

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
      {!isAvailable ? (
        <Label color="red"> {intl.formatMessage(messages.submitOnlyInStageProd)} </Label>
      ) : (
        <PFFeedbackModal
          email={user.identity.user.email}
          feedbackLocale={feedbackLocale}
          onShareFeedback={(_email, feedback) => {
            handleModalSubmission('Feedback', feedback).then((success) => {
              if (success === true) {
                return true;
              }
              return false;
            });
          }}
          onOpenSupportCase="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"
          feedbackImg={feedbackIllo}
          isOpen={isOpen ? true : false}
          onClose={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </React.Fragment>
  );
});

FeedbackModal.displayName = 'FeedbackModal';

export default FeedbackModal;
