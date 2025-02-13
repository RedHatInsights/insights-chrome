import React, { Fragment } from 'react';
import { AllServicesGroup, AllServicesLink, AllServicesSection, isAllServicesGroup } from '../AllServices/allServicesLinks';
import AllServicesGalleryLink from './AllServicesGalleryLink';
import AllServicesGallerySection from './AllServicesGallerySection';
import { titleToId } from '../../utils/common';

export type AllServicesGalleryProps = {
  selectedService: AllServicesSection;
};

const AllServicesGallery = ({ selectedService }: AllServicesGalleryProps) => {
  const sections: AllServicesGroup[] = [];
  const links: AllServicesLink[] = [];
  selectedService.links.forEach((link) => {
    if (isAllServicesGroup(link)) {
      sections.push(link);
    } else {
      links.push(link);
    }
  });
  return (
    <Fragment>
      {links.map((link, index) => (
        <AllServicesGalleryLink key={index} category={titleToId(selectedService.title)} {...link} />
      ))}
      {sections.map((section, index) => (
        <AllServicesGallerySection key={index} category={titleToId(selectedService.title)} {...section} />
      ))}
    </Fragment>
  );
};

export default AllServicesGallery;
