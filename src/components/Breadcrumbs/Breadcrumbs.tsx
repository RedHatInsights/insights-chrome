import { Breadcrumb, BreadcrumbItem, FlexItem, PageBreadcrumb } from '@patternfly/react-core';
import React, { useMemo } from 'react';

import useBreadcrumbsLinks from '../../hooks/useBreadcrumbsLinks';
import ChromeLink from '../ChromeLink/ChromeLink';
import './Breadcrumbs.scss';
import classNames from 'classnames';
import BreadcrumbsFavorites from './BreadcrumbsFavorites';
import { useFavoritePages } from '@redhat-cloud-services/chrome';
import MastheadMenuToggle from '../Header/MastheadMenuToggle';

export type Breadcrumbsprops = {
  isNavOpen?: boolean;
  hideNav?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Breadcrumbs = ({ hideNav, isNavOpen, setIsNavOpen }: Breadcrumbsprops) => {
  const segments = useBreadcrumbsLinks();
  const { favoritePages, favoritePage, unfavoritePage } = useFavoritePages();

  const activeSegment = useMemo(() => segments.find(({ active }) => active), [segments]);
  const isFavorited = useMemo(
    () => favoritePages.find(({ pathname, favorite }) => favorite && pathname === activeSegment?.href),
    [favoritePages, activeSegment]
  );
  return (
    <PageBreadcrumb className="chr-c-breadcrumbs pf-u-pt-0">
      <div className="chr-c-breadcrumbs__alignment">
        <FlexItem>{!hideNav && <MastheadMenuToggle setIsNavOpen={setIsNavOpen} isNavOpen={isNavOpen} />}</FlexItem>
        <FlexItem>
          <Breadcrumb>
            {segments.map(({ title, href }, index) => (
              <BreadcrumbItem
                to={href}
                component={(props) => (
                  <ChromeLink {...props} className={classNames(props.className, 'chr-c-breadcrumbs__link')} title={title} href={href} />
                )}
                key={index}
                isActive={segments.length - 1 === index}
              >
                {title}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </FlexItem>
        {activeSegment && (
          <FlexItem className="pf-u-ml-auto">
            <BreadcrumbsFavorites
              favoritePage={() => favoritePage(activeSegment.href)}
              unfavoritePage={() => unfavoritePage(activeSegment.href)}
              isFavorited={!!isFavorited}
            />
          </FlexItem>
        )}
      </div>
    </PageBreadcrumb>
  );
};

export default Breadcrumbs;
