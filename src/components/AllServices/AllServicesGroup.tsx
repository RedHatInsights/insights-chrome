import { Text, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import React, { Fragment } from 'react';

import AllServicesLink from './AllServicesLink';
import { AllServicesGroup } from './allServicesLinks';

export type AllServicesGroupProps = AllServicesGroup & {
  category: string;
};
const AllServicesGroup = ({ title, links, category }: AllServicesGroupProps) => {
  const filteredLinks = links;
  if (filteredLinks.length === 0) {
    return null;
  }
  return (
    <Fragment>
      <Text component={TextVariants.p} className="pf-v5-u-pt-xs pf-v5-u-font-weight-bold">
        {title}
      </Text>
      {filteredLinks.map((link, index) => (
        <AllServicesLink key={index} category={category} group={titleToId(title)} {...link} />
      ))}
    </Fragment>
  );
};

export default AllServicesGroup;
