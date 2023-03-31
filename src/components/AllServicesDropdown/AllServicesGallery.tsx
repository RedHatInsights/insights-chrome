import React, { Fragment } from 'react';
import { Gallery } from '@patternfly/react-core';
import { AllServicesGroup, AllServicesLink, AllServicesSection } from '../AllServices/allServicesLinks';
import { isAllServicesGroup } from '../AllServices/AllServicesSection';
import AllServicesGalleryLink from './AllServicesGalleryLink';
import AllServicesGallerySection from './AllServicesGallerySection';

export type AllServicesGalleryProps = {
  selectedService: AllServicesSection;
};

const AllServicesGallery = ({ selectedService }: AllServicesGalleryProps) => {
  const sections: AllServicesGroup[] = [];
  const links: AllServicesLink[] = [];
  selectedService.links.forEach((link) => {
    if (isAllServicesGroup(link as AllServicesGroup)) {
      sections.push(link as AllServicesGroup);
    } else {
      links.push(link as AllServicesLink);
    }
  });
  return (
    <Fragment>
      <Gallery hasGutter>
        {links.map((link, index) => (
          <AllServicesGalleryLink key={index} {...link} />
        ))}
      </Gallery>
      {sections.map((section, index) => (
        <AllServicesGallerySection key={index} {...section} />
      ))}
    </Fragment>
  );
};

export default AllServicesGallery;
