import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';

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
      <Label className="pf-v5-u-mb-md">{title}</Label>
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
