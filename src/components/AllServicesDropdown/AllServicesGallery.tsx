import { Card, CardBody, Gallery, Icon, Split, SplitItem, Text, TextContent } from '@patternfly/react-core';
import React from 'react';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import { bundleMapping } from '../../hooks/useBundle';
import { AllServicesLinkProps } from '../AllServices/AllServicesLink';
import { AllServicesGroup, AllServicesLink, AllServicesSection } from '../AllServices/allServicesLinks';
import ChromeLink from '../ChromeLink';

export type AllServicesGalleryProps = {
  selectedService: AllServicesSection;
};

const AllServicesGallery = ({ selectedService }: AllServicesGalleryProps) => {
  const linkDescription = (link: AllServicesLink | AllServicesGroup) => {
    if (link.description) {
      return link.description;
    } else {
      return '';
    }
  };
  const getBundle = (link: AllServicesLinkProps) => {
    if (link.href) {
      return bundleMapping[link.href.split('/')[1]];
    }
  };
  return (
    <Gallery hasGutter>
      {selectedService.links.map((link, index) => (
        <ChromeLink key={index} href={(link as AllServicesLink).href} className="chr-c-favorite-service__tile">
          <Card className="chr-c-link-service-card" isFlat isSelectableRaised>
            <CardBody className="pf-u-p-md">
              <Split>
                <SplitItem className="pf-m-fill">{link.title}</SplitItem>
                <SplitItem>
                  <Icon className="chr-c-icon-service-card">
                    <StarIcon />
                  </Icon>
                </SplitItem>
              </Split>
              <TextContent>
                <Text component="small">{getBundle(link as AllServicesLink)}</Text>
                <Text component="small" className="pf-u-color-100">
                  {linkDescription(link)}
                </Text>
              </TextContent>
            </CardBody>
          </Card>
        </ChromeLink>
      ))}
    </Gallery>
  );
};

export default AllServicesGallery;
