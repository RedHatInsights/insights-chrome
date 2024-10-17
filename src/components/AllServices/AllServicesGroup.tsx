import { Text, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
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
      <Text component={TextVariants.p} className="pf-v6-u-pt-xs pf-v6-u-font-weight-bold">
        {title}
      </Text>
      {filteredLinks.map((link, index) => (
        <AllServicesLink key={index} category={category} group={titleToId(title)} {...link} />
      ))}
    </Fragment>
  );
};

export default AllServicesGroup;
