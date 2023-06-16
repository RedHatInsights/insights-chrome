import React from 'react';
import { Button, Card, CardBody, Icon, Split, SplitItem, Text, TextContent } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import ChromeLink from '../ChromeLink';
import { bundleMapping } from '../../hooks/useBundle';

import './ServiceTile.scss';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';

export type ServiceTileProps = {
  name: React.ReactNode;
  pathname: string;
  description?: string;
  isExternal?: boolean;
};

const ServiceTile = ({ name, pathname, description, isExternal }: ServiceTileProps) => {
  const bundle = bundleMapping[pathname.split('/')[1]];
  const { unfavoritePage } = useFavoritePagesWrapper();
  return (
    <ChromeLink isExternal={isExternal} href={pathname} className="chr-c-favorite-service__tile">
      <Card className="chr-c-link-favorite-card" isFlat isFullHeight isSelectableRaised>
        <CardBody className="pf-v5-u-p-md">
          <Split>
            <SplitItem className="pf-v5-m-fill">{name}</SplitItem>
            <SplitItem>
              <Button
                onClick={(e) => {
                  // do not trigger click events on the the parent elements
                  e.stopPropagation();
                  e.preventDefault();
                  unfavoritePage(pathname);
                }}
                className="pf-v5-u-p-0"
                variant="plain"
              >
                <Icon className="pf-v5-u-ml-sm chr-c-icon-star">
                  <StarIcon />
                </Icon>
              </Button>
            </SplitItem>
          </Split>
          <TextContent>
            <Text component="small">{bundle}</Text>
            {description ? (
              <Text component="small" className="pf-v5-u-color-100">
                {description}
              </Text>
            ) : null}
          </TextContent>
        </CardBody>
      </Card>
    </ChromeLink>
  );
};

export default ServiceTile;
