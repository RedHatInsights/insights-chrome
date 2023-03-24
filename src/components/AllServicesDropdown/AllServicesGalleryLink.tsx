import React from 'react';
import { Card, CardBody, Icon, Split, SplitItem, Text, TextContent } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import { AllServicesLinkProps } from '../AllServices/AllServicesLink';
import ChromeLink from '../ChromeLink';
import { bundleMapping } from '../../hooks/useBundle';

export type AllServicesGalleryLinkProps = AllServicesLinkProps;

const AllServicesGalleryLink = ({ href, title, description }: AllServicesGalleryLinkProps) => {
  const getBundle = (href: string) => bundleMapping[href.split('/')[1]];
  return (
    <ChromeLink href={href} className="chr-c-favorite-service__tile">
      <Card className="chr-c-link-service-card" isFlat isSelectableRaised>
        <CardBody className="pf-u-p-md">
          <Split>
            <SplitItem className="pf-m-fill">{title}</SplitItem>
            <SplitItem>
              <Icon className="chr-c-icon-service-card">
                <StarIcon />
              </Icon>
            </SplitItem>
          </Split>
          <TextContent>
            <Text component="small">{getBundle(href)}</Text>
            <Text component="small" className="pf-u-color-100">
              {description ?? ''}
            </Text>
          </TextContent>
        </CardBody>
      </Card>
    </ChromeLink>
  );
};

export default AllServicesGalleryLink;
