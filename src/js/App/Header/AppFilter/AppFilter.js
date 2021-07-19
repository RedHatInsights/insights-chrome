import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';
import FilterIcon from '@patternfly/react-icons/dist/js/icons/filter-icon';

import {
  Flex,
  SearchInput,
  Split,
  SplitItem,
  TextContent,
  Text,
  Title,
  Spinner,
  Bullseye,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyState,
  EmptyStateVariant,
  DropdownToggle,
  Dropdown,
  Button,
} from '@patternfly/react-core';

import './AppFilter.scss';
import useAppFilter from './useAppFilter';
import ChromeLink from '../../Sidenav/Navigation/ChromeLink';

const App = ({ id, title, links = [] }) =>
  links.length > 0 ? (
    <div className="galleryItem">
      <Split>
        <SplitItem>
          <TextContent>
            <Text component="h4">{title}</Text>
            {links.map(({ href, title, isHidden, ...rest }) =>
              isHidden ? null : (
                <Text component="p" key={`${id}-${href}`}>
                  <ChromeLink {...rest} appId="static" title={title} href={href}>
                    {title}
                  </ChromeLink>
                </Text>
              )
            )}
          </TextContent>
        </SplitItem>
      </Split>
    </div>
  ) : null;

App.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.node,
  links: PropTypes.arrayOf(PropTypes.shape({ href: PropTypes.string.isRequired, title: PropTypes.string.isRequired })).isRequired,
};

const AppFilterDropdown = ({ isLoaded, setIsOpen, isOpen, filterValue, setFilterValue, filteredApps }) => {
  const dropdownRef = useRef(null);
  return (
    <Dropdown
      className="ins-c-page__app-filter-dropdown-toggle"
      onSelect={() => setIsOpen(true)}
      toggle={
        <DropdownToggle
          id="toggle-id"
          onToggle={(_isOpen, event) => {
            if (!dropdownRef.current?.contains(event.target)) {
              setIsOpen(!isOpen);
            }
          }}
          toggleIndicator={CaretDownIcon}
        >
          Find an app or service
        </DropdownToggle>
      }
      isOpen={isOpen}
      ouiaId="App Filter"
    >
      {ReactDOM.createPortal(
        <div ref={dropdownRef} className="pf-c-dropdown ins-c-page__app-filter-dropdown-menu" data-testid="ins-c__find-app-service">
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
};

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
  const { filteredApps, isLoaded, isOpen, setIsOpen, filterValue, setFilterValue } = useAppFilter();

  return (
    <React.Fragment>
      <AppFilterDropdown
        isLoaded={isLoaded}
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
