import { Card, CardBody, CardHeader } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import React from 'react';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { BundleNavigation } from '../../@types/types';
import AllServicesLink from './AllServicesLink';
import ChromeLink from '../ChromeLink';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import ServiceIcon, { FavorableIcons } from '../FavoriteServices/ServiceIcon';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

export type AllServicesSectionProps = BundleNavigation;

const AllServicesSection = ({ title, description, navItems }: AllServicesSectionProps) => {
  const items = navItems.flatMap(({ href, title, navItems, id, routes }) => {
    const children = routes || navItems;
    return children
      ? children.flatMap(({ routes, title: childTitle, href: subHref, id: subId }) => {
          return routes
            ? routes.map(({ href: childHref, id: childId, title: childTitle }) => ({
                title: childTitle,
                href: childHref,
                id: childId,
                bundleTitle: title,
                sectionTitle: childTitle,
              }))
            : { href: subHref, title: childTitle, id: subId, bundleTitle: title };
        })
      : { href, title, id };
  });
  console.log(items);

  const itemOverview = items.find((item) => item.title === 'Overview');
  const itemLearningResources = items.find((item) => item.title === 'Learning Resources');
  const itemDashboard = items.find((item) => item.title === 'Dashboard');

  const findIcon = (title: string) => {
    switch (title) {
      case 'OpenShift':
        return <ServiceIcon icon={FavorableIcons.OpenShiftIcon} />;
      case 'Red Hat Insights':
        return <ServiceIcon icon={FavorableIcons.InsightsIcon} />;
      case 'Ansible Automation Platform':
        return <ServiceIcon icon={FavorableIcons.AnsibleIcon} />;
      case 'Subscription Services':
        return <ServiceIcon icon={FavorableIcons.SubscriptionsIcon} />;
      case 'Identity & Access Management':
        return <ServiceIcon icon={FavorableIcons.PlaceholderIcon} />;
      case 'Settings':
        return <ServiceIcon icon={FavorableIcons.PlaceholderIcon} />;
      default:
        return null;
    }
  };

  return (
    <Card className="pf-v6-u-display-block pf-v6-u-mb-md">
      <CardHeader className="pf-v6-u-background-color-400">
        <Title headingLevel="h4" size="lg">
          <Split hasGutter>
            <SplitItem> {findIcon(title)} </SplitItem>
            <SplitItem> {title} </SplitItem>
          </Split>
        </Title>
        <Flex>
          {itemOverview ? (
            <FlexItem>
              <ChromeLink href={itemOverview.href ? itemOverview.href : ''} data-ouia-component-id={`${title}`}>
                {itemOverview.title}
              </ChromeLink>
            </FlexItem>
          ) : itemDashboard ? (
            <FlexItem>
              <ChromeLink href={itemDashboard.href ? itemDashboard.href : ''} data-ouia-component-id={`${title}`}>
                {itemDashboard.title}
              </ChromeLink>
            </FlexItem>
          ) : null}
          {itemOverview || itemDashboard ? (
            <FlexItem>
              <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle"> | </div>
            </FlexItem>
          ) : null}
          <FlexItem>
            {itemLearningResources ? (
              <ChromeLink href={itemLearningResources.href ? itemLearningResources.href : ''} data-ouia-component-id={`${title}`}>
                {itemLearningResources.title}
              </ChromeLink>
            ) : null}
          </FlexItem>
        </Flex>
        <Content component={ContentVariants.p} className="pf-v6-u-mb-md">
          {description || null}
        </Content>
      </CardHeader>
      <Divider />
      <CardBody>
        <Content className="pf-v6-u-font-size-sm">
          {items
            .sort((a, b) => (a.title && b.title ? a.title?.localeCompare(b.title) : -1))
            .map((link, index) => (
              <AllServicesLink key={index} {...link} />
            ))}
        </Content>
      </CardBody>
    </Card>
  );
};

export default AllServicesSection;
