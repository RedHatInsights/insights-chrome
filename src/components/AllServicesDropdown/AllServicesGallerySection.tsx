import { MenuGroup, MenuList } from '@patternfly/react-core/dist/dynamic/components/Menu';

import { AllServicesGroup } from '../AllServices/allServicesLinks';
import AllServicesGalleryLink from './AllServicesGalleryLink';
import { titleToId } from '../../utils/common';

export type AllServicesGallerySectionProps = AllServicesGroup & { category: string };

const AllServicesGallerySection = ({ title, links, category }: AllServicesGallerySectionProps) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <MenuGroup label={title} labelHeadingLevel="h4">
      <MenuList>
        {links.map((link, index) => (
          <AllServicesGalleryLink {...link} category={category} group={titleToId(title)} key={index} />
        ))}
      </MenuList>
    </MenuGroup>
  );
};

export default AllServicesGallerySection;
