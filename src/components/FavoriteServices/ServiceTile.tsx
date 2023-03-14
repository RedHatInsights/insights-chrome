import React, { useState } from 'react';
import { Button, Card, CardBody, Icon, Split, SplitItem, Text, TextContent } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import StarIconHalf from '@patternfly/react-icons/dist/js/icons/star-half-alt-icon';

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

// FIXME: Get the real description
const ServiceTile = ({ name, pathname, description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,', isExternal }: ServiceTileProps) => {
  const bundle = bundleMapping[pathname.split('/')[1]];
  const { unfavoritePage } = useFavoritePages();
  const [mouseOver, setMouseOver] = useState(false);
  return (
    <ChromeLink isExternal={isExternal} href={pathname} className="chr-c-favorite-service__tile">
      <Card isFlat isSelectableRaised>
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
                <Icon onMouseEnter={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)} status="warning">
                  {/* indicate the unfavorite action on clicking by showing half start icon */}
                  {mouseOver ? <StarIconHalf /> : <StarIcon />}
                </Icon>
              </Button>
            </SplitItem>
          </Split>
          <TextContent>
            <Text component="small">{bundle}</Text>
            <Text component="p">{description}</Text>
          </TextContent>
        </CardBody>
      </Card>
    </ChromeLink>
  );
};

export default ServiceTile;
