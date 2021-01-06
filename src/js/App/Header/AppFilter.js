import React, { useState, useEffect } from 'react';
import { safeLoad } from 'js-yaml';
import { Dropdown } from '@patternfly/react-core/dist/js/components/Dropdown/Dropdown';
import { DropdownToggle } from '@patternfly/react-core/dist/js/components/Dropdown/DropdownToggle';
import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';
import { SearchInput } from '@patternfly/react-core/dist/js/components/SearchInput/SearchInput';
import { TextContent } from '@patternfly/react-core/dist/js/components/Text/TextContent';
import { Text, TextVariants } from '@patternfly/react-core/dist/js/components/Text/Text';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core/dist/js/components/EmptyState/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/js/components/EmptyState/EmptyStateBody';
import { EmptyStateIcon } from '@patternfly/react-core/dist/js/components/EmptyState/EmptyStateIcon';
import { Title } from '@patternfly/react-core/dist/js/components/Title/Title';
import { Button } from '@patternfly/react-core/dist/js/components/Button/Button';

import { Gallery } from '@patternfly/react-core/dist/js/layouts/Gallery/Gallery';
import { GalleryItem } from '@patternfly/react-core/dist/js/layouts/Gallery/GalleryItem';

import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';
import ansible from '../../../../static/images/platform-icons/ansible.svg';
import openshift from '../../../../static/images/platform-icons/openshift.svg';
import costManagement from '../../../../static/images/platform-icons/cost-management.svg';
import migrationsNamespace from '../../../../static/images/platform-icons/migrations-namespace.svg';

import { getNavFromConfig } from '../../nav/globalNav';
import sourceOfTruth from '../../nav/sourceOfTruth';

import { FilterIcon } from '@patternfly/react-icons';

import './AppFilter.scss';

const getIcon = (id = 'default') =>
  ({
    insights: (
      <img
        className="ins-c-app-filter-app-icon"
        src={`${insights.chrome.isBeta() ? '/beta' : ''}/apps/landing/fonts/Insights.svg`}
        alt="Insights Logo"
      />
    ),
    openshift: <img className="ins-c-app-filter-app-icon" src={openshift} alt="Openshift Logo" />,
    SAP: <img className="ins-c-app-filter-app-icon" src={`${insights.chrome.isBeta() ? '/beta' : ''}/apps/landing/fonts/SAP.svg`} alt="SAP Logo" />,
    'cost-management': <img className="ins-c-app-filter-app-icon" src={costManagement} alt="Cost Management Logo" />,
    migrations: <img className="ins-c-app-filter-app-icon" src={migrationsNamespace} alt="Migration Services Logo" />,
    ansible: <img className="ins-c-app-filter-app-icon" src={ansible} alt="Automation Logo" />,
    default: <CogIcon className="ins-c-app-filter-app-icon" />,
  }[id]);

const appIds = ['insights', 'openshift', 'cost-management', 'migrations', 'subscriptions', 'ansible', 'settings'];

const AppFilter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);

  useEffect(() => {
    (async () => {
      const navigationYml = await sourceOfTruth();
      const appData = await getNavFromConfig(safeLoad(navigationYml), undefined);
      setApps(appIds.map((id) => appData[id]));
      setFilteredApps(appIds.map((id) => appData[id]));
    })();
  }, []);

  useEffect(() => {
    setFilteredApps(
      apps.filter((app) =>
        app?.routes?.some((subApp) => subApp.title.toLowerCase().includes(filterValue.toLowerCase()))
          ? { ...app, routes: app.routes.filter((subApp) => subApp.title.toLowerCase().includes(filterValue.toLowerCase())) }
          : false
      )
    );
  }, [filterValue]);

  const renderApp = (app) => (
    <GalleryItem>
      <TextContent className="ins-c-page__app-filter-app-title">
        {
          <React.Fragment>
            <Text component={TextVariants.h4}>
              {getIcon(app.id)}
              {app.title}
            </Text>
            {app.routes.map((subApp) => (
              <Text key={`${app.id}/${subApp.id}`} className="pf-u-pl-xl pf-u-ml-md">
                <a href={`${app.id}/${subApp.id}`}>{subApp.title}</a>
              </Text>
            ))}
          </React.Fragment>
        }
      </TextContent>
    </GalleryItem>
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
        {filteredApps?.length > 0 ? (
          <Gallery hasGutter>{filteredApps.map((app) => renderApp(app))}</Gallery>
        ) : (
          <EmptyState className="pf-u-mt-xl" variant={EmptyStateVariant.full}>
            <EmptyStateIcon className="pf-u-mb-xl" icon={FilterIcon} />
            <Title headingLevel="h4">No matching applications or services found.</Title>
            <EmptyStateBody className="pf-u-mb-xl">
              This filter criteria matches no applications or services. Try changing your inpout filter.
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
