import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { Fragment } from 'react';

import AllServicesLink from './AllServicesLink';
import { AllServicesGroup } from './allServicesLinks';

export type AllServicesGroupProps = AllServicesGroup & {
  category: string;
};
const AllServicesGroup = ({ links }: AllServicesGroupProps) => {
  const filteredLinks = links;
  if (filteredLinks.length === 0) {
    return null;
  }
  return (
    <Fragment>
      <Content component={ContentVariants.p} className="pf-v6-u-pt-xs pf-v6-u-font-weight-bold">
        chicken
      </Content>
      {filteredLinks.map((link, index) => (
        <AllServicesLink key={index} {...link} />
      ))}
    </Fragment>
  );
};

export default AllServicesGroup;
