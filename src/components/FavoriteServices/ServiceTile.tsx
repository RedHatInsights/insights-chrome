import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';

import ChromeLink from '../ChromeLink';
import { bundleMapping } from '../../hooks/useBundle';

import './ServiceTile.scss';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { FavorableIcons } from './ServiceIcon';

export type ServiceTileProps = {
  name: React.ReactNode;
  pathname: string;
  description?: string;
  isExternal?: boolean;
  icon?: FavorableIcons;
};

const ServiceTile = ({ name, pathname, description, isExternal }: ServiceTileProps) => {
  const bundle = bundleMapping[pathname.split('/')[1]];
  const { unfavoritePage } = useFavoritePagesWrapper();
  return (
    <ChromeLink isExternal={isExternal} href={pathname} className="chr-c-favorite-service__tile">
      <Content className="pf-v6-u-px-lg pf-v6-u-pt-md">
        <Content component="small">{bundle}</Content>
      </Content>
      <Split className="chr-c-link-favorite-card pf-v6-u-px-lg">
        <SplitItem className="pf-v6-u-pt-md" isFilled>
          {name}
        </SplitItem>
        <SplitItem className="pf-v6-u-mt-md">
          <Button
            icon={
              <Icon className="pf-v6-u-ml-sm chr-c-icon-star">
                <StarIcon />
              </Icon>
            }
            onClick={(e) => {
              // do not trigger click events on the the parent elements
              e.stopPropagation();
              e.preventDefault();
              unfavoritePage(pathname);
            }}
            className="pf-v6-u-p-0"
            variant="plain"
          />
        </SplitItem>
      </Split>
      <Content className="pf-v6-u-px-lg pf-v6-u-pb-md">
        {description ? (
          <Content component="small" className="pf-v6-u-color-100">
            {description}
          </Content>
        ) : null}
      </Content>
      <Divider />
    </ChromeLink>
  );
};

export default ServiceTile;
