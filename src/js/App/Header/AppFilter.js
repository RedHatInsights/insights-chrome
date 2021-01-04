import React, { useState, useEffect } from 'react';
import { safeLoad } from 'js-yaml';
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

import { getNavFromConfig } from '../../nav/globalNav';
import sourceOfTruth from '../../nav/sourceOfTruth';

import './AppFilter.scss';

const getIcon = (id = 'default') =>
  ({
    insights: <img className="ins-c-app-filter-app-icon" src="/apps/landing/fonts/Insights.svg" alt="Insights Logo" />,
    openshift: <img className="ins-c-app-filter-app-icon" src={openshift} alt="Openshift Logo" />,
    SAP: <img className="ins-c-app-filter-app-icon" src="/apps/landing/fonts/SAP.svg" alt="SAP Logo" />,
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

  useEffect(() => {
    (async () => {
      const navigationYml = await sourceOfTruth();
      const appData = await getNavFromConfig(safeLoad(navigationYml), undefined);
      setApps(appIds.map((id) => appData[id]));
    })();
  }, []);

  const renderApp = (app) =>
    app ? (
      <TextContent className="ins-c-page__app-filter-app-title">
        {
          <React.Fragment>
            <Text component={TextVariants.h4}>
              {getIcon(app.id)}
              {app.title}
            </Text>
            {app.routes.map((subApp) =>
              subApp.title.toLowerCase().includes(filterValue.toLocaleLowerCase()) ? (
                <Text className="pf-u-pl-xl pf-u-ml-md">
                  <a href={`${app.id}/${subApp.id}`}>{subApp.title}</a>
                </Text>
              ) : null
            )}
          </React.Fragment>
        }
      </TextContent>
    ) : null;

  // TODO: if this is here to stay, change to more generic dynamic layout!!!
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
            {renderApp(apps?.[0])}
            {renderApp(apps?.[1])}
          </GridItem>
          <GridItem span={4}>
            {renderApp(apps?.[2])}
            {renderApp(apps?.[3])}
            {renderApp(apps?.[4])}
            {renderApp(apps?.[5])}
          </GridItem>
          <GridItem span={4}>
            {renderApp(apps?.[6])}
            {renderApp(apps?.[7])}
          </GridItem>
        </Grid>
      </div>
    </Dropdown>
  );
};

export default AppFilter;

AppFilter.propTypes = {};
