import { Gallery, Title } from '@patternfly/react-core';
import React from 'react';
import { AllServicesGroup } from '../AllServices/allServicesLinks';
import AllServicesGalleryLink from './AllServicesGalleryLink';
import type { AllServicesLink as AllServicesLinkType } from '../AllServices/allServicesLinks';

export type AllServicesGallerySectionProps = AllServicesGroup;

const AllServicesGallerySection = ({ title, links }: AllServicesGallerySectionProps) => {
  return (
    <div className="pf-u-mb-lg">
      <Title className="pf-u-mb-md" headingLevel="h3">
        {title}
      </Title>
      <div>
        <Gallery hasGutter>
          {links.map((link, index) => (
            <AllServicesGalleryLink {...(link as AllServicesLinkType)} key={index} />
          ))}
        </Gallery>
      </div>
    </div>
  );
};

export default AllServicesGallerySection;
