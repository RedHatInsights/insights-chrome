import { Text, TextVariants } from '@patternfly/react-core';
import React, { Fragment } from 'react';
import { ITLess } from '../../utils/common';

import AllServicesLink from './AllServicesLink';
import { AllServicesGroup, isAllServicesLink } from './allServicesLinks';

export type AllServicesGroupProps = AllServicesGroup;
const AllServicesGroup = ({ title, links }: AllServicesGroupProps) => {
  const filteredLinks = ITLess() ? links.filter((link) => isAllServicesLink(link) && link.ITLess) : links;
  if (filteredLinks.length === 0) {
    return null;
  }
  return (
    <Fragment>
      <Text component={TextVariants.p} className="pf-v5-u-pt-xs pf-v5-u-font-weight-bold">
        {title}
      </Text>
      {filteredLinks.map((link, index) => (
        <AllServicesLink key={index} {...link} />
      ))}
    </Fragment>
  );
};

export default AllServicesGroup;
