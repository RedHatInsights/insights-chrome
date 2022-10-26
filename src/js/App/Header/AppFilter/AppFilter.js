import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

import { CaretDownIcon } from '@patternfly/react-icons/dist/js/icons/caret-down-icon';
import FilterIcon from '@patternfly/react-icons/dist/js/icons/filter-icon';

import {
  Bullseye,
  Button,
  Dropdown,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Flex,
  SearchInput,
  Spinner,
  Split,
  SplitItem,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';

import './AppFilter.scss';
import useAppFilter from './useAppFilter';
import ChromeLink from '../../Sidenav/Navigation/ChromeLink';
import { useLocation } from 'react-router-dom';

const App = ({ id, title, links = [], setIsOpen }) =>
  links.length > 0 ? (
    <div className="galleryItem">
      <Split>
        <SplitItem>
          <TextContent>
            <Text component="h4">{title}</Text>
            {links.map(({ filterable, href, title, isHidden, ...rest }) =>
              isHidden ? null : (
                <Text component="p" key={`${id}-${href}`} onClick={() => setIsOpen?.(false)}>
                  <ChromeLink {...rest} title={title} href={href}>
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
  setIsOpen: PropTypes.func,
};

const AppFilterDropdown = ({ isLoaded, setIsOpen, isOpen, filterValue, setFilterValue, filteredApps }) => {
  const dropdownRef = useRef(null);
  const { pathname } = useLocation();
  const intl = useIntl();

  useEffect(() => {
    if (isLoaded) {
      setIsOpen(false);
    }
  }, [pathname]);

  return (
    <Dropdown
      className="pf-m-full-height"
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
          All apps and services
        </DropdownToggle>
      }
      isOpen={isOpen}
      ouiaId="App Filter"
    >
      {ReactDOM.createPortal(
        <div ref={dropdownRef} className="pf-c-dropdown chr-c-page__app-filter-dropdown-menu" data-testid="chr-c__find-app-service">
          <div className="pf-c-dropdown__menu">
            <div className="chr-app-filter-content">
              {isLoaded ? (
                <React.Fragment>
                  <Flex className="chr-l-flex-app-filter-search">
                    <SearchInput
                      data-ouia-component-id="app-filter-search"
                      placeholder={intl.formatMessage(messages.findAppOrService)}
                      value={filterValue}
                      onChange={(val) => setFilterValue(val)}
                      onClear={(e) => {
                        setFilterValue('');
                        e.stopPropagation();
                      }}
                    />
                  </Flex>
                  {filteredApps?.length > 0 ? (
                    <div className="gallery">
                      {filteredApps.map((app) => (
                        <App key={app.id} {...app} setIsOpen={setIsOpen} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState className="pf-u-mt-xl" variant={EmptyStateVariant.full}>
                      <EmptyStateIcon className="pf-u-mb-xl" icon={FilterIcon} />
                      <Title headingLevel="h4">{intl.formatMessage(messages.noMatchingAppsFound)}</Title>
                      <EmptyStateBody className="pf-u-mb-xl">{intl.formatMessage(messages.tryChangingSearch)}</EmptyStateBody>
                      <Button
                        ouiaId="app-filter-clear-input"
                        className="pf-u-mt-lg"
                        variant="link"
                        onClick={(e) => {
                          setFilterValue('');
                          e.stopPropagation();
                        }}
                      >
                        {intl.formatMessage(messages.clearFilters)}
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
    </React.Fragment>
  );
};

export default AppFilter;
