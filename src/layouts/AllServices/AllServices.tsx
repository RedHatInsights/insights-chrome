import React from 'react';

import {
  Card,
  CardBody,
  CardHeader,
  Gallery,
  List,
  ListItem,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';

import ArrowRightIcon from '@patternfly/react-icons/dist/js/icons/arrow-right-icon';
import CloudSecurityIcon from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/js/icons/database-icon';
import DomainIcon from '@patternfly/react-icons/dist/js/icons/domain-icon';
import FlagIcon from '@patternfly/react-icons/dist/js/icons/flag-icon';
import InfrastructureIcon from '@patternfly/react-icons/dist/js/icons/infrastructure-icon';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import ScreenIcon from '@patternfly/react-icons/dist/js/icons/screen-icon';
// import TemplateIcon from '@patternfly/react-icons/dist/js/icons/template-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';

import './AllServices.scss';

const AllServices = () => (
  <Stack className="chr-l-stack-allservices pf-u-background-color-100 pf-u-p-xl">
    <StackItem className="pf-u-pl-lg">
      <Title headingLevel="h2">All Services</Title>
    </StackItem>
    <StackItem>
      <Gallery hasGutter>
        <Card isPlain>
          <CardHeader>
            <QuestionCircleIcon /> Application Services
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  API Designer
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  API Management
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Connectors
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Service Accounts
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Service Registry
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Streams of Apache Kafka
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <ArrowRightIcon /> Automation
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Automation Hub
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Automation Analytics
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Insights
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Remediations
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <DatabaseIcon /> Data Services
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Create, manage, and migrate relational and non-relational databases</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Data Access
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Data Science
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <FlagIcon /> Deploy
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Create, manage, and migrate relational and non-relational databases</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Database Access
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Data Science
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <UsersIcon /> Identity and Access Management
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Authentication policy
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  My User Access
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  User Access
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <ArrowRightIcon /> Infrastructure
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <DomainIcon /> Integration and Notifications
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Integration (Sources)
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Notifications
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Splunk | ServiceNow
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <InfrastructureIcon /> Inventories
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Clusters
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Edge
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Subscriptions
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Systems
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <ScreenIcon /> Observe
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Adviser
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Drift
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Recommendations
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Vulnerability
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <ArrowRightIcon /> Openshift
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <CloudSecurityIcon /> Security
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Advance Cluster Security
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Advisor
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Compliance
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Malware Detection
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Patch
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Policies
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Remediations
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Vulnerability
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <ArrowRightIcon /> Spend Management
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Cost Managementy
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Hybrid Committed Spend
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Subscription Inventory
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>
            <ArrowRightIcon /> System Configuration
          </CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Activation Keys
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Manifests
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Remote Host Configuration
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  Register RHEL Systems
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
        <Card isPlain>
          <CardHeader>Try and Buy</CardHeader>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.p}>Lorem ipsum dolor sit amet. Est dolores repellat</Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
              <Text component={TextVariants.p}>
                <Text component={TextVariants.a} href="#">
                  TBD
                </Text>
              </Text>
            </TextContent>
          </CardBody>
        </Card>
      </Gallery>
    </StackItem>
  </Stack>
);
export default AllServices;
