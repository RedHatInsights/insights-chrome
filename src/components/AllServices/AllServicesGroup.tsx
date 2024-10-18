import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { Fragment } from 'react';
import { ITLess, titleToId } from '../../utils/common';

import AllServicesLink from './AllServicesLink';
import { AllServicesGroup, isAllServicesLink } from './allServicesLinks';

export type AllServicesGroupProps = AllServicesGroup & {
  category: string;
};
const AllServicesGroup = ({ title, links, category }: AllServicesGroupProps) => {
  const filteredLinks = ITLess() ? links.filter((link) => isAllServicesLink(link) && link.ITLess) : links;
  if (filteredLinks.length === 0) {
    return null;
  }
  return (
    <Fragment>
      <Content component={ContentVariants.p} className="pf-v6-u-pt-xs pf-v6-u-font-weight-bold">
        {title}
      </Content>
      {filteredLinks.map((link, index) => (
        <AllServicesLink key={index} category={category} group={titleToId(title)} {...link} />
      ))}
    </Fragment>
  );
};

export default AllServicesGroup;
