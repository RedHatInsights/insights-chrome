import React from 'react';
import { MenuItem, MenuItemAction } from '@patternfly/react-core/dist/dynamic/components/Menu';

import ChromeLink from '../ChromeLink';
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
  const { unfavoritePage } = useFavoritePagesWrapper();
  return (
    <MenuItem
      isExternalLink={isExternal}
      description={description}
      component={(props) => <ChromeLink {...props} href={pathname} isExternal={isExternal} />}
      actions={
        !isExternal ? (
          <MenuItemAction
            className="pf-v6-u-align-self-center"
            isFavorited
            icon="favorites"
            actionId={`${pathname}-unfavorite`}
            aria-label={`Unfavorite ${name}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              unfavoritePage(pathname);
            }}
          />
        ) : undefined
      }
    >
      {name}
    </MenuItem>
  );
};

export default ServiceTile;
