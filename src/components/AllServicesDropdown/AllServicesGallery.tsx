import React, { useCallback, useEffect, useState } from 'react';
import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { AllServicesGroup, AllServicesLink, AllServicesSection, isAllServicesGroup } from '../AllServices/allServicesLinks';
import AllServicesGalleryLink from './AllServicesGalleryLink';
import AllServicesGallerySection from './AllServicesGallerySection';
import { JumpLinks, JumpLinksItem, Split, SplitItem } from '@patternfly/react-core';

export type AllServicesGalleryProps = {
  selectedService: AllServicesSection;
};

const AllServicesGallery = ({ selectedService }: AllServicesGalleryProps) => {
  const sanitizeTitle = useCallback(
    (title: string) => `${selectedService.id}-${title.replaceAll('.', '-').replaceAll(' ', '-')}`,
    [selectedService.id]
  );
  const [isActive, setIsActive] = useState<string>();
  const sections: AllServicesGroup[] = [];
  const links: AllServicesLink[] = [];
  selectedService.links.forEach((link) => {
    if (isAllServicesGroup(link)) {
      sections.push(link);
    } else {
      links.push(link);
    }
  });

  console.log(selectedService, 'this is selectedService!');

  useEffect(() => {
    setIsActive(sanitizeTitle(sections?.[0]?.title));
  }, [sections?.[0]?.title]);
  return (
    <Split hasGutter>
      <SplitItem isFilled>
        <Gallery hasGutter>
          {links.map((link, index) => (
            <AllServicesGalleryLink key={index} {...link} />
          ))}
        </Gallery>
        {sections.map((section, index) => (
          <AllServicesGallerySection key={index} sanitizeTitle={sanitizeTitle} {...section} />
        ))}
      </SplitItem>
      <SplitItem>
        <JumpLinks isVertical>
          {sections.map((section, index) => (
            <JumpLinksItem
              key={`${index}-jump-link`}
              isActive={isActive === sanitizeTitle(section.title)}
              onClick={() => {
                const itemId = sanitizeTitle(section.title);
                document.location.href = `${document.location.pathname}#${itemId}`;
                setIsActive(itemId);
              }}
            >
              {section.title}
            </JumpLinksItem>
          ))}
        </JumpLinks>
      </SplitItem>
    </Split>
  );
};

export default AllServicesGallery;
