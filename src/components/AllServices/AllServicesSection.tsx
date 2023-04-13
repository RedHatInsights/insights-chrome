import { Card, CardBody, CardTitle, Icon, Text, TextContent, TextVariants } from '@patternfly/react-core';
import React from 'react';
import { ITLess } from '../../utils/common';
import AllServicesGroup from './AllServicesGroup';
import AllServicesIcons from './AllServicesIcons';
import AllServicesLink from './AllServicesLink';
import { AllServicesLink as AllServicesLinkType, AllServicesSection, isAllServicesGroup, isAllServicesLink } from './allServicesLinks';

export type AllServicesSectionProps = AllServicesSection;

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
            isAllServicesGroup(link) ? (
              <AllServicesGroup key={index} {...link} />
            ) : (
              isAllServicesLink(link) && <AllServicesLink key={index} {...link} />
            )
          )}
        </TextContent>
      </CardBody>
    </Card>
  );
};

export default AllServicesSection;
