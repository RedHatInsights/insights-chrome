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
          <Card>
            <CardTitle>Your Registration Token</CardTitle>
            <CardBody>
              Use this token to register your Satellite server organization. Note: The token expires in 5 minutes.
              <div>
                <Button onClick={generateToken}>Generate Token</Button>
              </div>
              <ClipboardCopy className="pf-u-mt-md" isReadOnly hoverTip="Copy" clickTip="Copied">
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
                <ClipboardCopy className="pf-u-mt-md" isReadOnly hoverTip="Copy" clickTip="Copied">
                  hammer organization list
                </ClipboardCopy>
                <ListItem>
                  {`Run the Hybrid Cloud registration task to register your Red Hat Satellite organization, replacing "<organization_id>" with the organization id from
                  Step 2. You will prompted to enter the token from Step 1.`}
                </ListItem>
                <ClipboardCopy className="pf-u-mt-md" isReadOnly hoverTip="Copy" clickTip="Copied">
                  {`SATELLITE_RH_CLOUD_URL=https://mtls.console.stage.openshiftusgov.com org_id=<organization_id> foreman-rake rh_cloud:hybridcloud_register`}
                </ClipboardCopy>
              </List>
            </CardBody>
          </Card>
        </PageSection>
        <PageSection>
          <Card>
            <CardTitle>Registrations</CardTitle>
            <CardBody>
              <SatelliteTable />
            </CardBody>
          </Card>
        </PageSection>
      </Page>
    </div>
  );
};

export default SatelliteToken;
