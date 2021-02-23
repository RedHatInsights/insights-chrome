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
import { Flex } from '@patternfly/react-core/dist/js/layouts/Flex/Flex';
import { SearchInput } from '@patternfly/react-core/dist/js/components/SearchInput/SearchInput';
import { Split } from '@patternfly/react-core/dist/js/layouts/Split/Split';
import { SplitItem } from '@patternfly/react-core/dist/js/layouts/Split/SplitItem';
import { TextContent } from '@patternfly/react-core/dist/js/components/Text/TextContent';
import { Text } from '@patternfly/react-core/dist/js/components/Text/Text';
import { Title } from '@patternfly/react-core/dist/js/components/Title/Title';

import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';

import IconAnsible from './icon-ansible';
import IconCostManagement from './icon-cost-management';
import IconInsights from './icon-insights';
import IconMigrations from './icon-migrations';
import IconOpenshift from './icon-openshift';
import Iconsap from './icon-SAP';
import IconSubscriptions from './icon-subscriptions';

import './AppFilter.scss';
import useGlobalNav from '../../utils/useGlobalNav';

const getIcon = (id) =>
  ({
    ansible: <IconAnsible alt="Ansible Logo" />,
    'cost-management': <IconCostManagement alt="Cost Management Logo" />,
    insights: <IconInsights alt="Insights Logo" />,
    migrations: <IconMigrations alt="Migration Services Logo" />,
    openshift: <IconOpenshift alt="Openshift Logo" />,
    settings: <CogIcon fill="var(--pf-global--Color--300)" alt="Settings Icon" />,
    SAP: <IconSAP alt="SAP Logo" />,
    subscriptions: <IconSubscriptions alt="Subscriptions Logo" />,
  }[id]);

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

  return (
    <React.Fragment>
      <Dropdown
        className="ins-c-page__app-filter-dropdown"
        isPlain
        onSelect={() => setIsOpen(true)}
        toggle={
          <DropdownToggle id="toggle-id" onToggle={() => setIsOpen(!isOpen)} toggleIndicator={CaretDownIcon}>
            Apps and services
          </DropdownToggle>
        }
        isOpen={isOpen}
        ouiaId="App Filter"
      >
        <div className="content">
          <Flex className="search">
            <SearchInput
              placeholder="Find application or service"
              value={filterValue}
              onChange={(val) => setFilterValue(val)}
              onClear={() => setFilterValue('')}
            />
          </Flex>
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
      <div className={isOpen && 'pf-c-backdrop'} />
    </React.Fragment>
  );
};

export default AppFilter;

AppFilter.propTypes = {};
