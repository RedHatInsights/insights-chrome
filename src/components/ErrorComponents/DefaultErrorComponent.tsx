import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateActions, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { ExpandableSection } from '@patternfly/react-core/dist/dynamic/components/ExpandableSection';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import { chunkLoadErrorRefreshKey } from '../../utils/common';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import './ErrorComponent.scss';
import { get3scaleError } from '../../utils/responseInterceptors';
import GatewayErrorComponent from './GatewayErrorComponent';
import { getUrl } from '../../hooks/useBundle';
import { useAtomValue } from 'jotai';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';

export type DefaultErrorComponentProps = {
  error?: any | Error;
  errorInfo?: {
    componentStack?: string;
  };
  auth?: {
    loginSilent: () => Promise<void>;
    loginRedirect: () => Promise<void>;
  };
};

const DefaultErrorComponent = (props: DefaultErrorComponentProps) => {
  const intl = useIntl();
  const [sentryId, setSentryId] = useState<string | undefined>();

  const activeModule = useAtomValue(activeModuleAtom);
  const exceptionMessage = `Something Went Wrong: ${(props.error as Error)?.message || 'Unhandled UI runtime error'}`;
  useEffect(() => {
    const sentryId =
      props.error &&
      Sentry.captureException(new Error(exceptionMessage), {
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
  const gatewayError = get3scaleError(props.error as any, props.auth);
  if (gatewayError) {
    return <GatewayErrorComponent error={gatewayError} />;
  }

  const stack = props.errorInfo?.componentStack || (props.error instanceof Error && props.error?.stack) || props.error;
  return (
    <Bullseye className="chr-c-error-component">
      <EmptyState
        titleText={
          <Title size="lg" headingLevel="h1">
            {intl.formatMessage(messages.somethingWentWrong)}&nbsp;
            {sentryId && intl.formatMessage(messages.globalRuntimeErrorId, { errorId: sentryId })}
          </Title>
        }
        icon={ExclamationCircleIcon}
      >
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
                <Content>
                  {typeof props?.error === 'string' && (
                    <Content component="p" className="error-text">
                      {props.error}
                    </Content>
                  )}
                  {typeof props?.error === 'object' && typeof props?.error?.message === 'string' && (
                    <Content component="p" className="error-text">
                      {props.error.message}
                    </Content>
                  )}
                  {typeof stack === 'string' && (
                    <Content className="error-text" component="pre">
                      {stack.split('\n').map((content, index) => (
                        <div className="error-line" key={index}>
                          {content}
                        </div>
                      ))}
                    </Content>
                  )}
                </Content>
              </ExpandableSection>
            </FlexItem>
          </Flex>
        </EmptyStateBody>
        <EmptyStateActions>
          <Button component={() => <a href="/">{intl.formatMessage(messages.returnToHomepage)}</a>} variant="primary" />
        </EmptyStateActions>
      </EmptyState>
    </Bullseye>
  );
};

export default DefaultErrorComponent;
