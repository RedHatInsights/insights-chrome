import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Header } from '../components/Header/Header';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  ClipboardCopy,
  List,
  ListComponent,
  ListItem,
  Masthead,
  OrderType,
  Page,
  PageSection,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import SatelliteTable from '../components/Satellite/SatelliteTable';

const SatelliteToken: React.FC = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState(null);

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
        header={
          <Masthead className="chr-c-masthead">
            <Header />
          </Masthead>
        }
      >
        <PageSection padding={{ default: 'noPadding', md: 'padding', lg: 'padding' }}>
          <Text component={TextVariants.h2}>Your Registration Token</Text>
          <Text component={TextVariants.p}>Use this API token to authenticate against your Satellite system</Text>
          <div>
            <Button onClick={generateToken}>Generate Token</Button>
          </div>
          <ClipboardCopy className="pf-u-mt-md" isReadOnly hoverTip="Copy" clickTip="Copied">
            {token}
          </ClipboardCopy>
          <Card>
            <CardTitle>mTLS Registration</CardTitle>
            <CardBody>
              Satellite authenticates with Insights using mTLS. This section describes how to enable and verify authentication with a specific set of
              certificates
              <List component={ListComponent.ol} type={OrderType.number}>
                <ListItem>Sign in to the AppGate VPN.</ListItem>
                <ListItem>Copy the Registration Token above</ListItem>
                <ListItem>Sign in to the AppGate VPN.</ListItem>
                <ClipboardCopy hoverTip="Copy" clickTip="Copied" variant="inline-compact" isBlock>
                  hammer org list # get org id
                  {''}
                  org_id=3 \ SATELLITE_RH_CLOUD_URL=https://mtls.console.stage.openshiftusgov.com \ /usr/sbin/foreman-rake
                  rh_cloud:hybridcloud_register
                </ClipboardCopy>
              </List>
            </CardBody>
          </Card>
        </PageSection>
        <PageSection>
          <div className="pf-u-mt-md">
            <SatelliteTable />
          </div>
        </PageSection>
      </Page>
    </div>
  );
};

export default SatelliteToken;
