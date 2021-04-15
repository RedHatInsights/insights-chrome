import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
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
import { Spinner } from '@patternfly/react-core/dist/js/components/Spinner/Spinner';
import { Bullseye } from '@patternfly/react-core/dist/js/layouts/Bullseye/Bullseye';

import './AppFilter.scss';
import useGlobalNav from '../../utils/useGlobalNav';

const App = ({ id, title, routes, parent }) => (
  <div className="galleryItem">
    <Split>
      <SplitItem>
        <TextContent>
          <Text component="h4">{title}</Text>
          {routes.map((subApp) => {
            const redirectUrl = `${parent ? `${parent.id}/` : ''}${subApp.reload || `${id}/${subApp.id}`}`;

            return (
              <Text component="p" key={`${id}/${subApp.id}`}>
                <Text component="a" href={redirectUrl}>
                  {subApp.title}
                </Text>
              </Text>
            );
          })}
        </TextContent>
      </SplitItem>
    </Split>
  </div>
);

App.propTypes = {
  id: PropTypes.string,
  title: PropTypes.node,
  routes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })),
  parent: PropTypes.shape({
    id: PropTypes.string,
  }),
};

const AppFilterDropdown = ({ isLoaded, setIsOpen, isOpen, filterValue, setFilterValue, filteredApps }) => (
  <Dropdown
    className="ins-c-page__app-filter-dropdown-toggle"
    onSelect={() => setIsOpen(true)}
    toggle={
      <DropdownToggle id="toggle-id" onToggle={() => setIsOpen(!isOpen)} toggleIndicator={CaretDownIcon}>
        Find an app or service
      </DropdownToggle>
    }
    isOpen={isOpen}
    ouiaId="App Filter"
  >
    {ReactDOM.createPortal(
      <div className="pf-c-dropdown ins-c-page__app-filter-dropdown-menu">
        <div className="pf-c-dropdown__menu">
          <div className="content">
            {isLoaded ? (
              <React.Fragment>
                <Flex className="search">
                  <SearchInput
                    data-ouia-component-id="app-filter-search"
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
                    <Button ouiaId="app-filter-clear-input" className="pf-u-mt-lg" variant="link" onClick={() => setFilterValue('')}>
                      Clear all filters
                    </Button>
                  </EmptyState>
                )}
              </React.Fragment>
            ) : (
              <Bullseye className="pf-u-p-xl">
                <Spinner />
              </Bullseye>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
  </Dropdown>
);

AppFilterDropdown.propTypes = {
  isLoaded: PropTypes.bool,
  isOpen: PropTypes.bool,
  filterValue: PropTypes.string,
  setFilterValue: PropTypes.func,
  setIsOpen: PropTypes.func.isRequired,
  filteredApps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.node.isRequired,
      routes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })),
    })
  ),
};

const AppFilter = () => {
  const { filteredApps, isLoaded, isOpen, setIsOpen, filterValue, setFilterValue } = useGlobalNav();

  return (
    <React.Fragment>
      <AppFilterDropdown
        isLoaded={!!isLoaded}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        filteredApps={filteredApps}
      />
      <div className={classnames({ 'pf-c-backdrop': isOpen })} />
    </React.Fragment>
  );
};

export default AppFilter;
