import React from 'react';
import { Button, Card, CardBody, Icon, Split, SplitItem, Text, TextContent } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import ChromeLink from '../ChromeLink';
import { bundleMapping } from '../../hooks/useBundle';

import './ServiceTile.scss';
import { useFavoritePages } from '@redhat-cloud-services/chrome';

export type ServiceTileProps = {
  name: React.ReactNode;
  pathname: string;
  description?: string;
  isExternal?: boolean;
};

const ServiceTile = ({ name, pathname, description, isExternal }: ServiceTileProps) => {
  const bundle = bundleMapping[pathname.split('/')[1]];
  const { unfavoritePage } = useFavoritePages();
  return (
    <ChromeLink isExternal={isExternal} href={pathname} className="chr-c-favorite-service__tile">
      <Card className="chr-c-link-favorite-card" isFlat isFullHeight isSelectableRaised>
        <CardBody>
          <Split>
            <SplitItem className="pf-m-fill">{name}</SplitItem>
            <SplitItem>
              <Button
                onClick={(e) => {
                  // do not trigger click events on the the parent elements
                  e.stopPropagation();
                  e.preventDefault();
                  unfavoritePage(pathname);
                }}
                className="pf-u-p-0"
                variant="plain"
              >
                <Icon className="pf-u-ml-sm chr-c-icon-star">
                  <StarIcon />
                </Icon>
              </Button>
            </SplitItem>
          </Split>
          <TextContent>
            <Text component="small">{bundle}</Text>
            {description ? <Text component="p">{description}</Text> : null}
          </TextContent>
        </CardBody>
      </Card>
    </ChromeLink>
  );
};

export default ServiceTile;
