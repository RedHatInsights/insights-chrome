import React, { useState } from 'react';
import { Dropdown } from '@patternfly/react-core/dist/js/components/Dropdown/Dropdown';
import { DropdownToggle } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownToggle';
import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';
import { SearchInput } from '@patternfly/react-core/dist/js/components/SearchInput/SearchInput';
import { TextContent } from '@patternfly/react-core/dist/js/components/Text/TextContent';
import { Text, TextVariants } from '@patternfly/react-core/dist/js/components/Text/Text';
import { Grid } from '@patternfly/react-core/dist/js/layouts/Grid/Grid';
import { GridItem } from '@patternfly/react-core/dist/js/layouts/Grid/GridItem';

import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import ansible from '../../../../static/images/platform-icons/ansible.svg';
import openshift from '../../../../static/images/platform-icons/openshift.svg';
import costManagement from '../../../../static/images/platform-icons/cost-management.svg';
import migrationsNamespace from '../../../../static/images/platform-icons/migrations-namespace.svg';

import './AppFilter.scss';

const AppFilter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('');

  const appList = [
    {
      title: 'Red Hat Insights',
      id: 'insights',
      link: '/',
      icon: <img className="ins-c-app-filter-app-icon" src="/apps/landing/fonts/Insights.svg" alt="Insights Logo" />,
      subApps: [
        { title: 'Dashboard', link: '/insights/dashboard' },
        { title: 'Advisor', link: '/insights/advisor' },
        { title: 'Vulnerability', link: '/insights/vulnerability' },
        { title: 'Compliance', link: '/insights/compliance' },
        { title: 'Patch', link: '/insights/patch' },
        { title: 'Drift', link: '/insights/drift' },
        { title: 'Policies', link: '/insights/policies' },
        { title: 'Image Builder', link: '/' }, // TODO: Add link
      ],
    },
    {
      title: 'Red Hat OpenShift Cluster Manager',
      id: 'openshift',
      link: '/',
      icon: <img className="ins-c-app-filter-app-icon" src={openshift} alt="Openshift Logo" />,
      subApps: [{ title: 'Clusters', id: 'clusters', link: '/openshift' }],
    },
    {
      title: 'Insight for SAP',
      id: 'openshift',
      link: '/',
      icon: <img className="ins-c-app-filter-app-icon" src="/apps/landing/fonts/SAP.svg" alt="SAP Logo" />,
      subApps: [{ title: 'Dashboard', id: 'dashboard', link: '/' }],
    },
    {
      title: 'Cost Management',
      id: 'cost-management',
      link: '/',
      icon: <img className="ins-c-app-filter-app-icon" src={costManagement} alt="Cost Management Logo" />,
      subApps: [{ title: 'Red Hat Enterprise Linux', id: 'rhel', link: '/cost-management' }],
    },
    {
      title: 'Migration Services',
      id: 'migrations',
      link: '/',
      icon: <img className="ins-c-app-filter-app-icon" src={migrationsNamespace} alt="Migration Services Logo" />,
      subApps: [
        { title: 'Red Hat Enterprise Linux', id: 'rhel', link: '/migrations/migration-analytics' },
        { title: 'Red Hat Openshift', link: '/' }, // TODO: Add link
      ],
    },
    {
      title: 'Subscription Watch',
      id: 'subscriptions',
      link: '/',
      icon: <CogIcon className="ins-c-app-filter-app-icon" />,
      subApps: [
        { title: 'Red Hat Enterprise Linux', id: 'rhel', link: '/subscriptions' },
        { title: 'Red Hat Openshift', link: '/subscriptions/openshift-sw' },
      ],
    },
    {
      title: 'Red Hat Ansible Automation Platform',
      id: 'ansible',
      link: '/',
      icon: <img className="ins-c-app-filter-app-icon" src={ansible} alt="Automation Logo" />,
      subApps: [
        { title: 'Automation Analytics', link: '/ansible/automation-analytics' },
        { title: 'Automation Hub', link: '/ansible/automation-hub' },
        { title: 'Automation Service catalog', link: '/ansible/catalog' },
      ],
    },
    {
      title: 'Application Services',
      id: 'application-services',
      link: '/',
      icon: <CogIcon className="ins-c-app-filter-app-icon" />,
      subApps: [
        { title: 'OpenShift Dedicated', link: '/' }, // TODO: Add link
        { title: 'Streams for Managed Kafka', link: '/' }, // TODO: Add link
      ],
    },
    {
      title: 'Settings',
      id: 'settings',
      link: '/',
      icon: <CogIcon className="ins-c-app-filter-app-icon" />,
      subApps: [
        { title: 'User Access', link: '/settings/rbac' },
        { title: 'Sources', link: '/settings/sources' },
      ],
    },
  ];

  const renderApp = (app) => (
    <TextContent className="ins-c-page__app-filter-app-title">
      {
        <React.Fragment>
          <Text component={TextVariants.h4}>
            {app.icon}
            {app.title}
          </Text>
          {app.subApps.map((subApp) =>
            subApp.title.toLowerCase().includes(filterValue.toLocaleLowerCase()) ? (
              <Text className="pf-u-pl-xl pf-u-ml-md">
                <a href={`${subApp.link}`}>{subApp.title}</a>
              </Text>
            ) : null
          )}
        </React.Fragment>
      }
    </TextContent>
  );

  return (
    <Dropdown
      isPlain
      onSelect={() => setIsOpen(true)}
      toggle={
        <DropdownToggle className="ins-c-page__app-filter-togle" id="toggle-id" onToggle={() => setIsOpen(!isOpen)} toggleIndicator={CaretDownIcon}>
          All apps and services
        </DropdownToggle>
      }
      isOpen={isOpen}
      ouiaId="App Filter"
    >
      <div className="ins-c-page__app-filter-content">
        <SearchInput
          className="ins-c-page__app-filter-search"
          placeholder="Find application or service"
          value={filterValue}
          onChange={(val) => setFilterValue(val)}
          onClear={() => setFilterValue('')}
        />
        <Grid hasGutter>
          <GridItem span={4}>
            {renderApp(appList[0])}
            {renderApp(appList[1])}
          </GridItem>
          <GridItem span={4}>
            {renderApp(appList[2])}
            {renderApp(appList[3])}
            {renderApp(appList[4])}
            {renderApp(appList[5])}
          </GridItem>
          <GridItem span={4}>
            {renderApp(appList[6])}
            {renderApp(appList[7])}
            {renderApp(appList[8])}
          </GridItem>
        </Grid>
      </div>
    </Dropdown>
  );
};

export default AppFilter;

AppFilter.propTypes = {};
