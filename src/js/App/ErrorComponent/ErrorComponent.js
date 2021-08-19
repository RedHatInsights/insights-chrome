import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStatePrimary,
  EmptyStateBody,
  EmptyStateIcon,
  ExpandableSection,
  Title,
  Text,
  TextContent,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { getUrl } from '../../utils';

import './ErrorComponent.scss';

const ErrorComponent = (props) => {
  useEffect(() => {
    Sentry.captureException(new Error('Unhandled UI runtime error'), {
      bundle: getUrl('bundle'),
      app: getUrl('app'),
      error: props.error,
      trace: props.errorInfo?.componentStack,
    });
  }, []);
  return (
    <Bullseye className="ins-c-error-component">
      <EmptyState>
        <EmptyStateIcon color="var(--pf-global--danger-color--200)" icon={ExclamationCircleIcon} />
        <Title size="lg" headingLevel="h1">
          Something went wrong
        </Title>
        <EmptyStateBody>
          <p className="ins-c-error-component__text">
            There was a problem processing the request. Please try again. If the problem persists, contact{' '}
            <a target="_blank" href="https://access.redhat.com/support" rel="noreferrer">
              Red Hat support
            </a>{' '}
            or check our{' '}
            <a href="https://status.redhat.com/" target="_blank" rel="noreferrer">
              status page
            </a>{' '}
            for known outages.
          </p>
          <Flex alignContent={{ default: 'alignContentCenter' }} direction={{ default: 'column' }}>
            <FlexItem>
              <ExpandableSection toggleTextExpanded="Show less" toggleTextCollapsed="Show more">
                <TextContent>
                  {typeof props?.error === 'string' && <Text className="error-text">{props.error}</Text>}
                  {typeof props?.error === 'object' && typeof props?.error?.message === 'string' && (
                    <Text className="error-text">{props.error.message}</Text>
                  )}
                  {typeof props.errorInfo?.componentStack === 'string' && (
                    <Text className="error-text" component="code">
                      {props.errorInfo?.componentStack.split('\n').map((content, index) => (
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
          <Button
            variant="primary"
            onClick={() => {
              window.history.back();
            }}
          >
            Return to last page.
          </Button>
        </EmptyStatePrimary>
      </EmptyState>
    </Bullseye>
  );
};

ErrorComponent.propTypes = {
  error: PropTypes.any,
  errorInfo: PropTypes.object,
};

export default ErrorComponent;
