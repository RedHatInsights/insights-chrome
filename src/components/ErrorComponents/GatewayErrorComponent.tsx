import React, { Fragment } from 'react';
import NotAuthorized from '@redhat-cloud-services/frontend-components/NotAuthorized';
import sanitizeHtml from 'sanitize-html';
import { useAtomValue } from 'jotai';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import ChromeLink from '../ChromeLink/ChromeLink';
import { useIntl } from 'react-intl';
import Messages from '../../locales/Messages';
import { ThreeScaleError } from '../../utils/responseInterceptors';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { activeProductAtom } from '../../state/atoms/activeProductAtom';

export type GatewayErrorComponentProps = {
  error: ThreeScaleError;
  serviceName?: string;
};

const MuaLink = (chunks: React.ReactNode) => (
  <ChromeLink appId="rbac" href="/iam/my-user-access">
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
    <Content>
      {detail && complianceError ? (
        <Content component="p" dangerouslySetInnerHTML={{ __html: sanitizeHtml(detail) }}></Content>
      ) : (
        <Fragment>
          <Content component="p">{description}</Content>
          {detail && <Content component="p">{errorDetail}</Content>}
        </Fragment>
      )}
    </Content>
  );
};

const GatewayErrorComponent = ({ error, serviceName }: GatewayErrorComponentProps) => {
  const activeModule = useAtomValue(activeModuleAtom);
  const activeProduct = useAtomValue(activeProductAtom);

  return (
    <NotAuthorized
      bodyText={<Description complianceError={error.complianceError} detail={error.detail} />}
      serviceName={activeProduct || activeModule || serviceName}
    />
  );
};

export default GatewayErrorComponent;
