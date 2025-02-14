import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';

import React from 'react';
import { AllServicesGroup } from '../AllServices/allServicesLinks';
import AllServicesGalleryLink from './AllServicesGalleryLink';
import { titleToId } from '../../utils/common';

export type AllServicesGallerySectionProps = AllServicesGroup & { category: string };

const AllServicesGallerySection = ({ title, links, category }: AllServicesGallerySectionProps) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <div className="pf-v6-u-mb-lg">
      <Label className="pf-v6-u-mb-md">{title}</Label>
      <div>
        <Gallery hasGutter>
          {links.map((link, index) => (
            <AllServicesGalleryLink {...link} category={category} group={titleToId(title)} key={index} />
          ))}
        </Gallery>
      </div>
    </div>
  );
};

export default AllServicesGallerySection;
