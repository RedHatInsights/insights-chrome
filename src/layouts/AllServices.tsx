import React from 'react';

import {
  Card,
  CardBody,
  CardTitle,
  Gallery,
  Masthead,
  Page,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import ChromeLink from '../components/ChromeLink';

import AutomationIcon from '@patternfly/react-icons/dist/js/icons/automation-icon';
import BellIcon from '@patternfly/react-icons/dist/js/icons/bell-icon';
import ChartLineIcon from '@patternfly/react-icons/dist/js/icons/chart-line-icon';
import CloudSecurityIcon from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import CloudUploadAltIcon from '@patternfly/react-icons/dist/js/icons/cloud-upload-alt-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import CreditCardIcon from '@patternfly/react-icons/dist/js/icons/credit-card-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/js/icons/database-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import InfrastructureIcon from '@patternfly/react-icons/dist/js/icons/infrastructure-icon';
import RocketIcon from '@patternfly/react-icons/dist/js/icons/rocket-icon';
import ShoppingCartIcon from '@patternfly/react-icons/dist/js/icons/shopping-cart-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';

import Footer from '../components/Footer/Footer';
import './AllServices.scss';

const AllServices = () => (
  <div id="chrome-app-render-root">
    <Page
      onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
      header={
        <Masthead className="chr-c-masthead">
          <Header />
        </Masthead>
      }
    >
      <div className="chr-render">
        <RedirectBanner />
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
                      <input
                        className="pf-c-search-input__text-input"
                        type="text"
                        placeholder="Find a service"
                        aria-label="Find a service"
                        disabled
                      />
                    </span>
                  </div>
                </div>
              </StackItem>
            </StackItem>
            <StackItem>
              <Gallery hasGutter>
                <Card isPlain>
                  <CardTitle>
                    <CloudUploadAltIcon /> Application Services
                  </CardTitle>
                  <CardBody>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        Streamline your hybrid cloud experience, reducing the operational cost and complexity of delivering cloud-native applications.
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/beta/application-services/api-designer">API Designer</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/application-services/api-management">API Management</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/beta/application-services/connectors">Connectors</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/application-services/service-accounts">Service Accounts</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/application-services/service-registry">Service Registry</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/application-services/streams/overview">Streams of Apache Kafka</ChromeLink>
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
                        <ChromeLink href="/ansible/automation-analytics/reports">Automation Analytics</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/ansible/automation-hub">Automation Hub</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <Text component={TextVariants.p} href="">
                          Insights
                        </Text>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/ansible/remediations">Remediations</ChromeLink>
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
                        <ChromeLink href="/application-services/databases">Database Access</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/application-services/data-science">Data Science</ChromeLink>
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
                <Card isPlain>
                  <CardTitle>
                    <RocketIcon /> Deploy
                  </CardTitle>
                  <CardBody>
                    <TextContent>
                      <Text component={TextVariants.p}>Create RHEL images, systems at the Edge, and OpenShift clusters.</Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/edge/fleet-management">Edge Management</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/edge/manage-images">Image Builder</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/create">Clusters</ChromeLink>
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
                        <Text component={TextVariants.p} href="">
                          Authentication policy
                        </Text>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/settings/my-user-access">My User Access</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/edge/users">User Access</ChromeLink>
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
                        <ChromeLink href="/openshift">Clusters</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/overview">OpenShift</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/releases">Releases</ChromeLink>
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
                        <Text component={TextVariants.p} href="">
                          Integration (Sources)
                        </Text>
                      </Text>
                      <Text component={TextVariants.p}>
                        <Text component={TextVariants.p} href="">
                          Notifications
                        </Text>
                      </Text>
                      <Text component={TextVariants.p}>
                        <Text component={TextVariants.p} href="">
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
                      <Text component={TextVariants.p}>
                        View OpenShift clusters, Edge systems, RHEL hosts, and your organization&apos;s subscriptions.
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift">Clusters</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/edge/fleet-management">Edge</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <Text component={TextVariants.p} href="">
                          Subscriptions
                        </Text>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/dashboard">Systems</ChromeLink>
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
                <Card isPlain>
                  <CardTitle>
                    <ChartLineIcon />
                    Observe
                  </CardTitle>
                  <CardBody>
                    <TextContent>
                      <Text component={TextVariants.p}>Monitor, troubleshoot, and improve application performance.</Text>
                      <Text component={TextVariants.p} className="subtitle">
                        Ansible
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/ansible/advisor/recommendations#workloads=Ansible+Automation+Platform&SIDs=&tags=">Adviser</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/ansible/drift">Drift</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/ansible/policies">Policies</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p} className="subtitle">
                        OpenShift
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/insights/advisor/recommendations">Advisor</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/insights/vulnerability/">Vulnerability</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p} className="subtitle">
                        RHEL
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/advisor/recommendations">Advisor</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/drift">Drift</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/patch/advisories">Patch as Content</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/policies/list">Policies</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="insights/remediations">Remediations</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/ros">Resource Optimization</ChromeLink>
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

                      <Text component={TextVariants.p} className="subtitle">
                        Ansible
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/ansible/remediations">Remediations</ChromeLink>
                      </Text>

                      <Text component={TextVariants.p} className="subtitle">
                        OpenShift
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/insights/advisor/recommendations">Advanced Cluster Security</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/insights/vulnerability/">Vulnerability</ChromeLink>
                      </Text>

                      <Text component={TextVariants.p} className="subtitle">
                        RHEL
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/advisor/recommendations">Advisor</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/compliance/">Compliance</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/edge/fleet-managements">Edge</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/malware/">Malware</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/patch/advisories">Patch</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/edge/cves">Vulnerability</ChromeLink>
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
                <Card isPlain>
                  <CardTitle>
                    <CreditCardIcon />
                    Spend Management
                  </CardTitle>
                  <CardBody>
                    <TextContent>
                      <Text component={TextVariants.p}>Control costs and monitor committed spend.</Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/cost-management">Cost Management</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <Text component={TextVariants.p} href="">
                          Hybrid Committed Spend
                        </Text>
                      </Text>
                      <Text component={TextVariants.p}>
                        <Text component={TextVariants.p} href="">
                          Subscription Inventory
                        </Text>
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
                <Card isPlain>
                  <CardTitle>
                    <CogIcon />
                    System Configuration
                  </CardTitle>
                  <CardBody>
                    <TextContent>
                      <Text component={TextVariants.p}>Connect your RHEL systems to Hybrid Cloud Console services.</Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/settings/connector/activation-keys">Activation Keys</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <Text component={TextVariants.p} href="">
                          Manifests
                        </Text>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/insights/registration">Register Systems</ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/settings/connector">Remote Host Configuration</ChromeLink>
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
                <Card isPlain>
                  <CardTitle>
                    <ShoppingCartIcon />
                    Try and Buy
                  </CardTitle>
                  <CardBody>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        Our no-cost trials help you gain hands-on experience, prepare for a certification, or assess if a product is right for your
                        organization.
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/openshift/sandbox" target="_blank">
                          Developer Sandbox
                          <ExternalLinkAltIcon />
                        </ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="https://marketplace.redhat.com/en-us" rel="noopener noreferrer" target="_blank">
                          Red Hat Marketplace
                          <ExternalLinkAltIcon />
                        </ChromeLink>
                      </Text>
                      <Text component={TextVariants.p}>
                        <ChromeLink href="https://www.redhat.com/en/products/trials" rel="noopener noreferrer" target="_blank">
                          Red Hat Product Trials
                          <ExternalLinkAltIcon />
                        </ChromeLink>
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
              </Gallery>
            </StackItem>
          </Stack>
        </PageSection>
        <Footer />
      </div>
    </Page>
  </div>
);
export default AllServices;
