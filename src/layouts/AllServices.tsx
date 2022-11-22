import React from 'react';

import {
  Card,
  CardBody,
  CardTitle,
  Gallery,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { faSpaceAwesome } from '@fortawesome/free-brands-svg-icons';

import AutomationIcon from '@patternfly/react-icons/dist/js/icons/automation-icon';
import BellIcon from '@patternfly/react-icons/dist/js/icons/bell-icon';
import CloudSecurityIcon from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/js/icons/database-icon';
import FlagIcon from '@patternfly/react-icons/dist/js/icons/flag-icon';
import InfrastructureIcon from '@patternfly/react-icons/dist/js/icons/infrastructure-icon';
import OpenShiftIcon from '@patternfly/react-icons/dist/js/icons/openshift-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';

import Footer from '../components/Footer/Footer.js';
import './AllServices.scss';

const AllServices = () => (
  <>
    <PageSection variant={PageSectionVariants.light} className="pf-m-fill">
      <Stack className="chr-l-stack-allservices pf-u-background-color-100">
        <StackItem className="sticky pf-u-background-color-100">
          <StackItem className="pf-u-pl-lg pf-u-pb-md">
            <Title headingLevel="h2">All Services</Title>
          </StackItem>
          <StackItem className="pf-u-pl-lg pf-u-pb-md-on-md">
            <div className="pf-c-search-input">
              <div className="pf-c-search-input__bar">
                <span className="pf-c-search-input__text">
                  <span className="pf-c-search-input__icon">
                    <i className="fas fa-search fa-fw" aria-hidden="true"></i>
                  </span>
                  <input className="pf-c-search-input__text-input" type="text" placeholder="Find a service" aria-label="Find a service" />
                </span>
              </div>
            </div>
          </StackItem>
        </StackItem>
        <StackItem>
          <Gallery hasGutter>
            <Card isPlain>
              <CardTitle>
                <FontAwesomeIcon icon={faCloudArrowUp} /> Application Services
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>
                    Streamline your hybrid cloud experience, reducing the operational cost and complexity of delivering cloud-native applications.
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/beta/application-services/api-designer">
                      API Designer
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/application-services/api-management">
                      API Management
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/beta/application-services/connectors ">
                      Connectors
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/application-services/service-accounts ">
                      Service Accounts
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/application-services/service-registry ">
                      Service Registry
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/application-services/streams/overview ">
                      Streams of Apache Kafka
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <AutomationIcon /> Automation
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Solve problems once, in one place, and scale up. </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/ansible/automation-analytics/reports">
                      Automation Analytics
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/ansible/automation-hub">
                      Automation Hub
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Insights
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/ansible/remediations">
                      Remediations
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <DatabaseIcon /> Data Services
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Create, manage, and migrate relational and non-relational databases</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/application-services/databases">
                      Database Access
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/application-services/data-science">
                      Data Science
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <FontAwesomeIcon icon={faSpaceAwesome} /> Deploy
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Create RHEL images, systems at the Edge, and OpenShift clusters.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/edge/fleet-management">
                      Edge Management
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/edge/manage-images">
                      Image Builder
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift/create">
                      Clusters
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <UsersIcon /> Identity and Access Management
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Ensure that the right users have the appropriate access to technology resources.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Authentication policy
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/settings/my-user-access">
                      My User Access
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift/create">
                      User Access
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <InfrastructureIcon /> Infrastructure
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Manage your infrastructure across the hybrid cloud.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift">
                      Clusters
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift/overview">
                      Openshift
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift/releases">
                      Releases
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <BellIcon /> Integration and Notifications
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Alerts users to events, using email and integrations such as Webhooks.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Integration (Sources)
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Notifications
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Splunk | ServiceNow
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <InfrastructureIcon /> Inventories
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>View OpenShift clusters, Edge systems, RHEL hosts, and your organization's subscriptions.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift">
                      Clusters 
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/edge/fleet-management">
                      Edge
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Subscriptions
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/insights/dashboard">
                      Systems
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <FontAwesomeIcon icon={faChartLine} />
                &nbsp;Observe
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Monitor, troubleshoot, and improve application performance.</Text>
                  <Text component={TextVariants.p}>Ansible</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Adviser for OpenShift
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Advisor for RHEL
                    </Text>
                  </Text>

                  <Text component={TextVariants.p}>Openshift</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Drift
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Patch as Content
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>RHEL</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Resource Optimization
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Recommendations
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <OpenShiftIcon /> Openshift
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Create and monitor OpenShift clusters.</Text>
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
              <CardTitle>
                <CloudSecurityIcon /> Security
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Meet your policy and compliance objectives.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Advance Cluster Security
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Advisor
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Compliance
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Malware
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Patch
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Policies
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Remediations
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Vulnerability
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <FontAwesomeIcon icon={faCreditCard} />
                &nbsp;&nbsp;Spend Management
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Control costs and monitor committed spend.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift/cost-management">
                      Cost Management
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Hybrid Committed Spend
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Subscription Inventory
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <FontAwesomeIcon icon={faCog} />
                &nbsp;&nbsp;System Configuration
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>Connect your RHEL systems to Hybrid Cloud Console services.</Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/settings/connector/activation-keys">
                      Activation Keys
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.p} href="#">
                      Manifests
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/insights/registration">
                      Register Systems
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/settings/connector">
                      Remote Host Configuration
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
            <Card isPlain>
              <CardTitle>
                <FontAwesomeIcon icon={faCartShopping} />
                &nbsp;Try and Buy
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>
                    Our no-cost trials help you gain hands-on experience, prepare for a certification, or assess if a product is right for your
                    organization.
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="/openshift/sandbox">
                      Developer Sandbox
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="https://marketplace.redhat.com/en-us">
                      Red Hat Marketplace
                    </Text>
                  </Text>
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href="https://www.redhat.com/en/products/trials">
                      Red Hat Product Trials
                    </Text>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
          </Gallery>
        </StackItem>
      </Stack>
    </PageSection>
    <Footer />
  </>
);
export default AllServices;
