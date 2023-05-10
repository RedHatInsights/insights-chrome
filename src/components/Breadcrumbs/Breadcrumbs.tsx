import { Breadcrumb, BreadcrumbItem, FlexItem, PageBreadcrumb } from '@patternfly/react-core';
import React, { useMemo } from 'react';

import useBreadcrumbsLinks from '../../hooks/useBreadcrumbsLinks';
import ChromeLink from '../ChromeLink/ChromeLink';
import './Breadcrumbs.scss';
import classNames from 'classnames';
import BreadcrumbsFavorites from './BreadcrumbsFavorites';
import MastheadMenuToggle from '../Header/MastheadMenuToggle';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';

export type Breadcrumbsprops = {
  isNavOpen?: boolean;
  hideNav?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Breadcrumbs = ({ hideNav, isNavOpen, setIsNavOpen }: Breadcrumbsprops) => {
  const segments = useBreadcrumbsLinks();
  const { favoritePages, favoritePage, unfavoritePage } = useFavoritePagesWrapper();

  const leafHref = segments[segments.length - 1]?.href;
  const isFavorited = useMemo(() => favoritePages.find(({ pathname, favorite }) => favorite && pathname === leafHref), [favoritePages, leafHref]);

  return (
    <PageBreadcrumb className="chr-c-breadcrumbs pf-u-p-0">
      <div className="pf-u-display-flex pf-u-justify-content-space-between pf-u-pt-sm pf-u-pb-0 pf-u-pl-md">
        <FlexItem>{!hideNav && <MastheadMenuToggle setIsNavOpen={setIsNavOpen} isNavOpen={isNavOpen} />}</FlexItem>
        <FlexItem className="pf-u-flex-grow-1">
          <Breadcrumb className="pf-u-pt-sm">
            {segments.map(({ title, href }, index) => (
              <BreadcrumbItem
                to={href}
                component={(props) => (
                  <ChromeLink {...props} className={classNames(props.className, 'chr-c-breadcrumbs__link')} title={title} href={href} />
                )}
                key={index}
                isActive={segments.length - 1 === index}
                className="pf-u-pb-sm"
              >
                {title}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </FlexItem>
        {leafHref && (
          <FlexItem>
            <BreadcrumbsFavorites
              favoritePage={() => favoritePage(leafHref)}
              unfavoritePage={() => unfavoritePage(leafHref)}
              isFavorited={!!isFavorited}
            />
          </FlexItem>
        )}
      </div>
    </PageBreadcrumb>
  );
};

export default Breadcrumbs;
