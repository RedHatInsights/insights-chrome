import React, { Fragment } from 'react';
import NotAuthorized from '@redhat-cloud-services/frontend-components/NotAuthorized';
import { useSelector } from 'react-redux';
import sanitizeHtml from 'sanitize-html';

import type { ReduxState } from '../../redux/store';
import ChromeLink from '../ChromeLink/ChromeLink';
import { Text, TextContent } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import Messages from '../../locales/Messages';
import { ThreeScaleError } from '../../utils/responseInterceptors';

export type GatewayErrorComponentProps = {
  error: ThreeScaleError;
};

const MuaLink = (chunks: React.ReactNode) => (
  <ChromeLink appId="rbac" href="/settings/my-user-access">
    {chunks}
  </ChromeLink>
);

type DescriptionProps = {
  detail?: string;
  complianceError?: boolean;
};

const Description = ({ detail, complianceError }: DescriptionProps) => {
  const intl = useIntl();
  const description = intl.formatMessage(Messages.permissionErrorDescription, {
    MuaLink,
  });
  const errorDetail = intl.formatMessage(Messages.permissionErrorDetail, {
    message: detail || '',
  });
  return (
    <TextContent>
      {detail && complianceError ? (
        <Text dangerouslySetInnerHTML={{ __html: sanitizeHtml(detail) }}></Text>
      ) : (
        <Fragment>
          <Text>{description}</Text>
          {detail && <Text>{errorDetail}</Text>}
        </Fragment>
      )}
    </TextContent>
  );
};

const GatewayErrorComponent = ({ error }: GatewayErrorComponentProps) => {
  // get active product, fallback to module name if product is not defined
  const serviceName = useSelector((state: ReduxState) => state.chrome.activeProduct || state.chrome.activeModule);
  return <NotAuthorized description={<Description complianceError={error.complianceError} detail={error.detail} />} serviceName={serviceName} />;
};

export default GatewayErrorComponent;
