import { Card, CardBody, CardTitle, Text, TextContent, TextVariants } from '@patternfly/react-core';
import React from 'react';
import AllServicesGroup from './AllServicesGroup';
import AllServicesIcons from './AllServicesIcons';
import AllServicesLink from './AllServicesLink';
import type { AllServicesGroup as AllServicesGroupType, AllServicesLink as AllServicesLinkType, AllServicesSection } from './allServicesLinks';

export type AllServicesSectionProps = AllServicesSection;

const isAllServicesGroup = (item: AllServicesGroupType | AllServicesLinkType): item is AllServicesGroup => {
  return (item as AllServicesGroupType).isGroup === true;
};

const AllServicesSection = ({ icon, title, description, links }: AllServicesSectionProps) => {
  const TitleIcon = AllServicesIcons[icon];
  return (
    <Card isPlain>
      <CardTitle>
        <TitleIcon />
        {title}
      </CardTitle>
      <CardBody>
        <TextContent>
          <Text component={TextVariants.p}>{description}</Text>
          {links.map((link, index) =>
            isAllServicesGroup(link) ? <AllServicesGroup key={index} {...link} /> : <AllServicesLink key={index} {...link} />
          )}
        </TextContent>
      </CardBody>
    </Card>
  );
};

export default AllServicesSection;
