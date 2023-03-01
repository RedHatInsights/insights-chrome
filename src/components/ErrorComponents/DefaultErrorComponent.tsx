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
import { chunkLoadErrorRefreshKey, getUrl } from '../../utils/common';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { useSelector } from 'react-redux';
import { ReduxState } from '../../redux/store';
import './ErrorComponent.scss';
import { get3scaleError } from '../../utils/responseInterceptors';
import GatewayErrorComponent from './GatewayErrorComponent';

export type DefaultErrorComponentProps = {
  error?: any | Error;
  errorInfo?: {
    componentStack?: string;
  };
};

const DefaultErrorComponent = (props: DefaultErrorComponentProps) => {
  const intl = useIntl();

  const [sentryId, setSentryId] = useState<string | undefined>();
  const activeModule = useSelector(({ chrome: { activeModule } }: ReduxState) => activeModule);
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
    // When a chunk error occurs, save it with sentry and reload the page.
    // After ten seconds, the key will be removed from localStorage
    // so the page can refresh again if the chunk has not been fixed in akamai
    if (activeModule && props.error?.cause?.name == 'ChunkLoadError') {
      const moduleStorageKey = `${chunkLoadErrorRefreshKey}-${activeModule}`;
      // explicitly track chunk loading errors
      window?.segment?.track('chunk-loading-error', {
        bundle: getUrl('bundle'),
        app: getUrl(),
        pathname: window.location.pathname,
        message: (props.error as Error).message,
        sentryId,
      });
      const moduleHasReloaded = localStorage.getItem(moduleStorageKey);
      if (moduleHasReloaded !== 'true') {
        localStorage.setItem(moduleStorageKey, 'true');
        location.reload();
      }
    }
  }, [props.error, activeModule]);

  // second level of error capture if xhr/fetch interceptor fails
  const gatewayError = get3scaleError(props.error as any);
  if (gatewayError) {
    return <GatewayErrorComponent error={gatewayError} />;
  }

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
