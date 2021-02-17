import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core/dist/js/components/Button/Button';
import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';
import { Dropdown } from '@patternfly/react-core/dist/js/components/Dropdown/Dropdown';
import { DropdownToggle } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownToggle';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core/dist/js/components/EmptyState/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/js/components/EmptyState/EmptyStateIcon';
import { EmptyStateBody } from '@patternfly/react-core/dist/js/components/EmptyState/EmptyStateBody';
import FilterIcon from '@patternfly/react-icons/dist/js/icons/filter-icon';
import { SearchInput } from '@patternfly/react-core/dist/js/components/SearchInput/SearchInput';
import { Split } from '@patternfly/react-core/dist/js/layouts/Split/Split';
import { SplitItem } from '@patternfly/react-core/dist/js/layouts/Split/SplitItem';
import { TextContent } from '@patternfly/react-core/dist/js/components/Text/TextContent';
import { Text } from '@patternfly/react-core/dist/js/components/Text/Text';
import { Title } from '@patternfly/react-core/dist/js/components/Title/Title';

import ansible from '../../../../static/images/landing-page-icons/ansible.svg';
import costManagement from '../../../../static/images/landing-page-icons/cost-management.svg';
import migrationsNamespace from '../../../../static/images/landing-page-icons/migrations.svg';
import openshift from '../../../../static/images/landing-page-icons/ocm.svg';
import settings from '../../../../static/images/landing-page-icons/fa-cog.svg';

import './AppFilter.scss';
import useGlobalNav from '../../utils/useGlobalNav';

const getIcon = (id) =>
  ({
    insights: <img src={`${insights.chrome.isBeta() ? '/beta' : ''}/apps/landing/fonts/Insights.svg`} alt="Insights Logo" />,
    openshift: <img src={openshift} alt="Openshift Logo" />,
    SAP: <img src={`${insights.chrome.isBeta() ? '/beta' : ''}/apps/landing/fonts/SAP.svg`} alt="SAP Logo" />,
    'cost-management': <img src={costManagement} alt="Cost Management Logo" />,
    migrations: <img src={migrationsNamespace} alt="Migration Services Logo" />,
    ansible: <img src={ansible} alt="Automation Logo" />,
    settings: <img src={settings} alt="settings" />,
    subscriptions: <img src={`${insights.chrome.isBeta() ? '/beta' : ''}/apps/landing/fonts/Subscriptions.svg`} alt="Subscriptions Logo" />,
  }[id]);

const App = ({ id, title, routes }) => (
  <div className="galleryItem">
    <Split>
      <SplitItem className="left">{getIcon(id)}</SplitItem>
      <SplitItem className="right">
        <TextContent>
          <Text component="h4">{title}</Text>
          {routes.map((subApp) => (
            <Text component="p" key={`${id}/${subApp.id}`}>
              <Text component="a" href={`${id}/${subApp.id}`}>
                {subApp.title}
              </Text>
            </Text>
          ))}
        </TextContent>
      </SplitItem>
    </Split>
  </div>
);

App.propTypes = {
  id: PropTypes.string,
  title: PropTypes.node,
  routes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })),
};

const AppFilter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const { apps, filteredApps, setFilteredApps } = useGlobalNav();

  useEffect(() => {
    setFilteredApps(
      apps
        .map((app) => ({ ...app, routes: app.routes.filter((subApp) => subApp.title.toLowerCase().includes(filterValue.toLowerCase())) }))
        .filter((app) => app.routes?.length > 0)
    );
  }, [filterValue]);

  return (
    <Dropdown
      className="ins-c-page__app-filter-dropdown"
      isPlain
      onSelect={() => setIsOpen(true)}
      toggle={
        <DropdownToggle id="toggle-id" onToggle={() => setIsOpen(!isOpen)} toggleIndicator={CaretDownIcon}>
          Applications and services
        </DropdownToggle>
      }
      isOpen={isOpen}
      ouiaId="App Filter"
    >
      <div className="content">
        <SearchInput
          placeholder="Find application or service"
          value={filterValue}
          onChange={(val) => setFilterValue(val)}
          onClear={() => setFilterValue('')}
        />
        {filteredApps?.length > 0 ? (
          <div className="gallery">
            {filteredApps.map((app) => (
              <App key={app.id} {...app} />
            ))}
          </div>
        ) : (
          <EmptyState className="pf-u-mt-xl" variant={EmptyStateVariant.full}>
            <EmptyStateIcon className="pf-u-mb-xl" icon={FilterIcon} />
            <Title headingLevel="h4">No matching applications or services found.</Title>
            <EmptyStateBody className="pf-u-mb-xl">
              This filter criteria matches no applications or services. Try changing your input filter.
            </EmptyStateBody>
            <Button className="pf-u-mt-lg" variant="link" onClick={() => setFilterValue('')}>
              Clear all filters
            </Button>
          </EmptyState>
        )}
      </div>
    </Dropdown>
  );
};

export default AppFilter;

AppFilter.propTypes = {};
