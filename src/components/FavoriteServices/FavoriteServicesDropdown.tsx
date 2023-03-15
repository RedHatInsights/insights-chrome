import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownToggle,
  Gallery,
  Icon,
  Level,
  LevelItem,
  Stack,
  StackItem,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import React, { Fragment, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';

import ChromeLink from '../ChromeLink';
import { useFavoritePages } from '@redhat-cloud-services/chrome';
import useAllServices from '../../hooks/useAllServices';
import ServiceTile, { ServiceTileProps } from './ServiceTile';
import EmptyState from './EmptyState';

import './FavoriteServicesDropdown.scss';

const QuickAccess = () => (
  <StackItem>
    Get quick access to your favorite services. To add more services to your Favorites,{' '}
    <ChromeLink href="/allservices">browse all Hybrid Cloud Console services.</ChromeLink>
  </StackItem>
);

const FavoriteServicesDropdown = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { favoritePages } = useFavoritePages();
  const { servicesLinks } = useAllServices();

  // extract human friendly data from the all services data set
  const favoritedServices = favoritePages.reduce<ServiceTileProps[]>((acc, curr) => {
    const service = servicesLinks.find(({ isExternal, href }) => !isExternal && href.includes(curr.pathname));
    // only pick favorite link if it is favorited and application exists in our all services registry
    if (curr.favorite && service) {
      return [
        ...acc,
        {
          name: service.title,
          pathname: curr.pathname,
        },
      ];
    }

    return acc;
  }, []);

  return (
    <Dropdown
      className="pf-m-full-height"
      toggle={
        <DropdownToggle
          id="toggle-id"
          onToggle={(_isOpen, event) => {
            if (!dropdownRef.current?.contains(event.target)) {
              setIsOpen((prev) => !prev);
            }
          }}
          toggleIndicator={null}
        >
          <Fragment>
            <Icon isInline className="pf-u-mr-sm ins-m-hide-on-sm">
              <StarIcon />
            </Icon>
            Favorites
          </Fragment>
        </DropdownToggle>
      }
      isOpen={isOpen}
      ouiaId="App Filter"
    >
      {createPortal(
        <div ref={dropdownRef} className="pf-c-dropdown chr-c-favorite-services-dropdown">
          <div>
            <div className="chr-app-filter-content pf-u-p-lg-on-md pf-u-px-2xl-on-md">
              <Stack className="pf-u-background-color-100">
                <StackItem className="pf-u-pb-md">
                  <Level>
                    <LevelItem>
                      <Title headingLevel="h2">Favorited Services</Title>
                    </LevelItem>
                    <LevelItem>
                      <Button aria-label="Close favorite services dropdown" onClick={() => setIsOpen(false)} variant="plain">
                        <Icon>
                          <CloseIcon />
                        </Icon>
                      </Button>
                    </LevelItem>
                  </Level>
                </StackItem>
                <QuickAccess />
                {favoritePages.length === 0 ? (
                  <EmptyState />
                ) : (
                  <StackItem className="pf-u-pt-xl">
                    <Gallery hasGutter>
                      {favoritedServices.map((props, index) => (
                        <ServiceTile {...props} key={index} />
                      ))}
                      <Card isPlain className="chr-c-card-centered pf-u-background-color-200">
                        <CardBody className="pf-u-pt-lg">
                          <TextContent>
                            <Text component="p">Go to the All Services page to tag your favorites.</Text>
                            <Text component="p">
                              <ChromeLink href="/allservices">View all services</ChromeLink>
                            </Text>
                          </TextContent>
                        </CardBody>
                      </Card>
                    </Gallery>
                  </StackItem>
                )}
              </Stack>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Dropdown>
  );
};

export default FavoriteServicesDropdown;
