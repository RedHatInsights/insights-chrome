import { Card, CardBody, CardTitle, Icon, Text, TextContent, TextVariants } from '@patternfly/react-core';
import React from 'react';
import { ITLess } from '../../utils/common';
import AllServicesGroup from './AllServicesGroup';
import AllServicesIcons from './AllServicesIcons';
import AllServicesLink from './AllServicesLink';
import type { AllServicesGroup as AllServicesGroupType, AllServicesLink as AllServicesLinkType, AllServicesSection } from './allServicesLinks';

export type AllServicesSectionProps = AllServicesSection;

export const isAllServicesGroup = (item: AllServicesGroupType | AllServicesLinkType): item is AllServicesGroup => {
  return (item as AllServicesGroupType).isGroup === true;
};

export function isAllServicesLink(item: AllServicesLinkType): item is AllServicesLinkType {
  return !!(item as AllServicesLinkType).href;
}

const AllServicesSection = ({ icon, title, description, links }: AllServicesSectionProps) => {
  const TitleIcon = AllServicesIcons[icon as keyof typeof AllServicesIcons];
  const filteredLinks = ITLess() ? links.filter((link) => (link as AllServicesLinkType).ITLess) : links;
  return (
    <Card className="pf-u-display-block pf-u-mb-md pf-u-background-color-100">
      <CardTitle>
        <Icon className="pf-u-mr-xs" isInline>
          {TitleIcon && <TitleIcon />}
        </Icon>
        {title}
      </CardTitle>
      <CardBody>
        <TextContent className="pf-u-font-size-sm">
          <Text component={TextVariants.p} className="pf-u-mb-md">
            {description || null}
          </Text>
          {filteredLinks.map((link, index) =>
            isAllServicesGroup(link as AllServicesGroupType) ? (
              <AllServicesGroup key={index} {...(link as AllServicesGroupType)} />
            ) : (
              <AllServicesLink key={index} {...(link as AllServicesLinkType)} />
            )
          )}
        </TextContent>
      </CardBody>
    </Card>
  );
};

export default AllServicesSection;
