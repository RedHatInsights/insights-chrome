import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Content } from '@patternfly/react-core/dist/dynamic/components/content';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';

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
      <Content component="small" className="pf-v6-u-px-lg pf-v6-u-mb-sm">
        {title}
      </Content>
      <div>
        {links.map((link, index) => (
          <AllServicesGalleryLink {...link} category={category} group={titleToId(title)} key={index} />
        ))}
      </div>
      <Divider />
    </div>
  );
};

export default AllServicesGallerySection;
