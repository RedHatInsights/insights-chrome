import { Card, CardBody, CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import React from 'react';
import { ITLess, titleToId } from '../../utils/common';
import AllServicesGroup from './AllServicesGroup';
import AllServicesLink from './AllServicesLink';
import { AllServicesSection, isAllServicesGroup } from './allServicesLinks';
import ServiceIcon from '../FavoriteServices/ServiceIcon';

export type AllServicesSectionProps = AllServicesSection;

const AllServicesSection = ({ icon, title, description, links }: AllServicesSectionProps) => {
  const TitleIcon = icon ? <ServiceIcon icon={icon} /> : null;
  const filteredLinks = ITLess() ? links.filter((link) => link.ITLess) : links;
  return (
    <Card className="pf-v6-u-display-block pf-v6-u-mb-md pf-v6-u-background-color-100">
      <CardTitle>
        <Icon className="pf-v6-u-mr-xs" isInline>
          {TitleIcon}
        </Icon>
        {title}
      </CardTitle>
      <CardBody>
        <Content className="pf-v6-u-font-size-sm">
          <Content component={ContentVariants.p} className="pf-v6-u-mb-md">
            {description || null}
          </Content>
          {filteredLinks.map((link, index) =>
            isAllServicesGroup(link) ? (
              <AllServicesGroup key={index} category={titleToId(title)} {...link} />
            ) : (
              <AllServicesLink key={index} {...link} category={titleToId(title)} />
            )
          )}
        </Content>
      </CardBody>
    </Card>
  );
};

export default AllServicesSection;
