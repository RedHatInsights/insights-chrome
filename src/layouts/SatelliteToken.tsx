import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useFlag } from '@unleash/proxy-client-react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card, CardBody, CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { ClipboardCopy } from '@patternfly/react-core/dist/dynamic/components/ClipboardCopy';
import { List, ListComponent, ListItem, OrderType } from '@patternfly/react-core/dist/dynamic/components/List';
import { Page, PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import SatelliteTable from '../components/Satellite/SatelliteTable';
import IPWhitelistTable from '../components/Satellite/IPWhitelistTable';
import { getEnv } from '../utils/common';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import NotFoundRoute from '../components/NotFoundRoute';

const SatelliteToken: React.FC = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState<boolean>(false);
  const { auth } = useChrome();
  const isITLess = useFlag('platform.chrome.itless');

  if (!isITLess) {
    return <NotFoundRoute />;
  }

  useEffect(() => {
    auth.getUser().then((user) => user && setIsOrgAdmin(!!user?.identity?.user?.is_org_admin));
  }, []);

  const generateToken = () => {
    axios
      .get('/api/identity/certificate/token')
      .then((res) => {
        setToken(res.data.token);
      })
      .catch((err) => {
        console.log(err);
        setError(err);
      });
  };
  const itlessProd = getEnv() === 'frh';
  const satelliteUrl = itlessProd ? 'https://mtls.console.openshiftusgov.com' : 'https://mtls.console.stage.openshiftusgov.com';
  useEffect(() => {
    if (token.length < 1 && error === null) {
      generateToken();
    }
  }, [token]);

  return (
    <div>
      <Page
        className="chr-c-all-services"
        onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
      >
        <PageSection hasBodyWrapper={false} padding={{ default: 'noPadding', md: 'padding', lg: 'padding' }}>
          <Card>
            <CardTitle>Your Registration Token</CardTitle>
            <CardBody>
              Use this token to register your Satellite server organization. Note: The token expires in 5 minutes.
              <div>
                <Button onClick={generateToken}>Generate Token</Button>
              </div>
              <ClipboardCopy className="pf-v6-u-mt-md" isReadOnly hoverTip="Copy" clickTip="Copied">
                {token}
              </ClipboardCopy>
            </CardBody>
          </Card>

          <Card>
            <CardTitle>Satellite organization registration.</CardTitle>
            <CardBody>
              Every Satellite server organization must be registered following the steps below.
              <List component={ListComponent.ol} type={OrderType.number}>
                <ListItem>Copy the registration token above</ListItem>
                <ListItem>Run the following command from your Satellite server to get the organization id you want to register</ListItem>
                <ClipboardCopy className="pf-v6-u-mt-md" isReadOnly hoverTip="Copy" clickTip="Copied">
                  hammer organization list
                </ClipboardCopy>
                <ListItem>
                  {`Run the Hybrid Cloud registration task to register your Red Hat Satellite organization, replacing "<organization_id>" with the organization id from
                  Step 2. You will prompted to enter the token from Step 1.`}
                </ListItem>
                <ClipboardCopy className="pf-v6-u-mt-md" isReadOnly hoverTip="Copy" clickTip="Copied">
                  {`SATELLITE_RH_CLOUD_URL=${satelliteUrl} org_id=<organization_id> foreman-rake rh_cloud:hybridcloud_register`}
                </ClipboardCopy>
              </List>
            </CardBody>
          </Card>
        </PageSection>
        <PageSection hasBodyWrapper={false}>
          <Card>
            <CardTitle>Registrations</CardTitle>
            <CardBody>
              <SatelliteTable />
            </CardBody>
          </Card>
        </PageSection>
        {isOrgAdmin ? (
          <PageSection hasBodyWrapper={false}>
            <Card>
              <CardTitle>IP allowlist</CardTitle>
              <CardBody>
                <IPWhitelistTable />
              </CardBody>
            </Card>
          </PageSection>
        ) : null}
      </Page>
    </div>
  );
};

export default SatelliteToken;
