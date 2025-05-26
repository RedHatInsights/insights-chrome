import { Card, CardBody, CardHeader } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { useMemo } from 'react';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { BundleNavigation } from '../../@types/types';
import AllServicesLink from './AllServicesLink';
import ChromeLink from '../ChromeLink';
import ServiceIcon, { FavorableIcons } from '../FavoriteServices/ServiceIcon';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

type AllServicesBundleProps = BundleNavigation;

const AllServicesBundle = ({ id, title, description, navItems }: AllServicesBundleProps) => {
  const items = navItems.flatMap(({ href, title, navItems, id, routes, isExternal }) => {
    const children = routes || navItems;
    return children
      ? children.flatMap(({ routes, title: childTitle, href: subHref, id: subId, isExternal }) => {
          return routes
            ? routes.map(({ href: childHref, id: nestedId, title: nestedTitle, isExternal }) => ({
                title: nestedTitle,
                href: childHref,
                id: nestedId,
                bundleTitle: title,
                sectionTitle: childTitle,
                isExternal: isExternal,
              }))
            : { href: subHref, title: childTitle, id: subId, bundleTitle: title, isExternal };
        })
      : { href, title, id, isExternal };
  });

  const itemOverview = items.find((item) => item.title === 'Overview');
  const itemLearningResources = items.find((item) => item.title === 'Learning Resources');
  const itemDashboard = items.find((item) => item.title === 'Dashboard');

  const bundleIcon = useMemo(() => {
    switch (id) {
      case 'openshift':
        return <ServiceIcon icon={FavorableIcons.OpenShiftIcon} />;
      case 'insights':
        return <ServiceIcon icon={FavorableIcons.InsightsIcon} />;
      case 'ansible':
        return <ServiceIcon icon={FavorableIcons.AnsibleIcon} />;
      case 'subscriptions':
        return <ServiceIcon icon={FavorableIcons.SubscriptionsIcon} />;
      case 'iam':
        return <ServiceIcon icon={FavorableIcons.IAmIcon} />;
      case 'settings':
        return <ServiceIcon icon={FavorableIcons.SettingsIcon} />;
      case 'otherServices':
        return <ServiceIcon icon={FavorableIcons.OtherServicesIcon} />;
      default:
        return null;
    }
  }, [id]);

  return (
    <Card className="pf-v6-u-mb-md" isCompact>
      <CardHeader className="pf-v6-u-background-color-400">
        <Split hasGutter>
          <SplitItem> {bundleIcon} </SplitItem>
          <SplitItem className="pf-v6-u-pt-xs" isFilled>
            <Content component={ContentVariants.h4}>{title}</Content>
            <Content component={ContentVariants.small}>
              {itemOverview ? (
                <ChromeLink
                  className="chr-c-favorite-service__tile pf-v6-u-display-inline"
                  href={itemOverview.href ? itemOverview.href : ''}
                  data-ouia-component-id={`${title}`}
                >
                  {itemOverview.title}
                </ChromeLink>
              ) : itemDashboard ? (
                <ChromeLink
                  className="chr-c-favorite-service__tile pf-v6-u-display-inline"
                  href={itemDashboard.href ? itemDashboard.href : ''}
                  data-ouia-component-id={`${title}`}
                >
                  {itemDashboard.title}
                </ChromeLink>
              ) : null}
              {itemOverview || itemDashboard ? <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle"> | </span> : null}

              {itemLearningResources ? (
                <ChromeLink
                  className="chr-c-favorite-service__tile pf-v6-u-display-inline"
                  href={itemLearningResources.href ? itemLearningResources.href : ''}
                  data-ouia-component-id={`${title}`}
                >
                  {itemLearningResources.title}
                </ChromeLink>
              ) : null}
            </Content>
          </SplitItem>
        </Split>

        <Content component={ContentVariants.p} className="pf-v6-u-mb-md">
          {description || null}
        </Content>
      </CardHeader>
      <Divider />{' '}
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

export default AllServicesBundle;
