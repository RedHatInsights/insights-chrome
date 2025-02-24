import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
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
    <>
      <div className="pf-v6-u-pb-sm">
        <Content component="small" className="pf-v6-u-px-lg pf-v6-u-mb-sm pf-v6-u-mt-md">
          {title}
        </Content>
        <div>
          {links.map((link, index) => (
            <AllServicesGalleryLink {...link} category={category} group={titleToId(title)} key={index} />
          ))}
        </div>
      </div>
      <Divider />
    </>
  );
};

export default AllServicesGallerySection;
