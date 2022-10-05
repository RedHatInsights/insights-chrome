import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStatePrimary,
  ExpandableSection,
  Flex,
  FlexItem,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { getUrl } from '../../../utils/common';
import { useIntl } from 'react-intl';
import messages from '../../../locales/Messages';

import './ErrorComponent.scss';

export type DefaultErrorComponentProps = {
  error?: string | Error;
  errorInfo?: {
    componentStack?: string;
  };
};

const DefaultErrorComponent = (props: DefaultErrorComponentProps) => {
  const intl = useIntl();
  const [sentryId, setSentryId] = useState<string | undefined>();
  useEffect(() => {
    const sentryId = Sentry.captureException(new Error('Unhandled UI runtime error'), {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bundle: getUrl('bundle'),
      app: getUrl('app'),
      error: (props.error instanceof Error && props.error?.message) || props.error,
      trace: props.errorInfo?.componentStack || (props.error instanceof Error && props.error?.stack) || props.error,
    });
    setSentryId(sentryId);
  }, []);
  const stack = props.errorInfo?.componentStack || (props.error instanceof Error && props.error?.stack) || props.error;
  return (
    <Bullseye className="chr-c-error-component">
      <EmptyState>
        <EmptyStateIcon color="var(--pf-global--danger-color--200)" icon={ExclamationCircleIcon} />
        <Title size="lg" headingLevel="h1">
          {intl.formatMessage(messages.somethingWentWrong)}&nbsp;
          {sentryId && intl.formatMessage(messages.globalRuntimeErrorId, { errorId: sentryId })}
        </Title>
        <EmptyStateBody>
          <p className="chr-c-error-component__text">
            {intl.formatMessage(messages.problemProcessingRequest)}{' '}
            <a target="_blank" href="https://access.redhat.com/support" rel="noreferrer">
              {intl.formatMessage(messages.redHatSupport)}
            </a>{' '}
            {intl.formatMessage(messages.checkOur)}{' '}
            <a href="https://status.redhat.com/" target="_blank" rel="noreferrer">
              {intl.formatMessage(messages.statusPage)}
            </a>{' '}
            {intl.formatMessage(messages.knownOutages)}
          </p>
          <Flex alignContent={{ default: 'alignContentCenter' }} direction={{ default: 'column' }}>
            <FlexItem>
              <ExpandableSection toggleTextExpanded="Show less" toggleTextCollapsed="Show more">
                <TextContent>
                  {typeof props?.error === 'string' && <Text className="error-text">{props.error}</Text>}
                  {typeof props?.error === 'object' && typeof props?.error?.message === 'string' && (
                    <Text className="error-text">{props.error.message}</Text>
                  )}
                  {typeof stack === 'string' && (
                    <Text className="error-text" component="pre">
                      {stack.split('\n').map((content, index) => (
                        <div className="error-line" key={index}>
                          {content}
                        </div>
                      ))}
                    </Text>
                  )}
                </TextContent>
              </ExpandableSection>
            </FlexItem>
          </Flex>
        </EmptyStateBody>
        <EmptyStatePrimary>
          <Button component={() => <a href="/">{intl.formatMessage(messages.returnToHomepage)}</a>} variant="primary" />
        </EmptyStatePrimary>
      </EmptyState>
    </Bullseye>
  );
};

export default DefaultErrorComponent;
