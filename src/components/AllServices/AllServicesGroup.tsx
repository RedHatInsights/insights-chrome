import { Text, TextVariants } from '@patternfly/react-core';
import React, { Fragment } from 'react';
import { ITLess } from '../../utils/common';

import AllServicesLink from './AllServicesLink';
import { AllServicesGroup } from './allServicesLinks';

export type AllServicesGroupProps = AllServicesGroup;
const AllServicesGroup = ({ title, links }: AllServicesGroupProps) => {
  const filteredLinks = ITLess() ? links.filter((link) => link.ITLess) : links;
  return (
    <Fragment>
      <Text component={TextVariants.p} className="pf-u-pt-xs pf-u-font-weight-bold">
        {title}
      </Text>
      {filteredLinks.map((link, index) => (
        <AllServicesLink key={index} {...link} />
      ))}
    </Fragment>
  );
};

export default AllServicesGroup;
