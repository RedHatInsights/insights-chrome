import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import React from 'react';
import { AllServicesGroup } from '../AllServices/allServicesLinks';
import AllServicesGalleryLink from './AllServicesGalleryLink';

export type AllServicesGallerySectionProps = AllServicesGroup;

const AllServicesGallerySection = ({ title, links }: AllServicesGallerySectionProps) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <div className="pf-v5-u-mb-lg">
      <Title className="pf-v5-u-mb-md" headingLevel="h3">
        {title}
      </Title>
      <div>
        <Gallery hasGutter>
          {links.map((link, index) => (
            <AllServicesGalleryLink {...link} key={index} />
          ))}
        </Gallery>
      </div>
    </div>
  );
};

export default AllServicesGallerySection;
