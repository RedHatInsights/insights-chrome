import React from 'react';
import { Menu, MenuContent, MenuList } from '@patternfly/react-core/dist/dynamic/components/Menu';
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
    <Menu isPlain>
      <MenuContent>
        {links.length > 0 && (
          <MenuList>
            {links.map((link, index) => (
              <AllServicesGalleryLink key={index} category={titleToId(selectedService.title)} {...link} />
            ))}
          </MenuList>
        )}
        {sections.map((section, index) => (
          <AllServicesGallerySection key={index} category={titleToId(selectedService.title)} {...section} />
        ))}
      </MenuContent>
    </Menu>
  );
};

export default AllServicesGallery;
