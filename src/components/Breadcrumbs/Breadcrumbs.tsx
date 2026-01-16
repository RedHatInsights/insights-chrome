import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';

import React, { useEffect, useMemo, useState } from 'react';
import { OpenShiftIntercomModule } from '../OpenShiftIntercom';
import useBreadcrumbsLinks from '../../hooks/useBreadcrumbsLinks';
import ChromeLink from '../ChromeLink/ChromeLink';
import classNames from 'classnames';
import BreadcrumbsFavorites from './BreadcrumbsFavorites';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';

export type Breadcrumbsprops = {
  isNavOpen?: boolean;
  hideNav?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Breadcrumbs = () => {
  const segments = useBreadcrumbsLinks();
  const { favoritePages, favoritePage, unfavoritePage } = useFavoritePagesWrapper();

  const leafHref = segments[segments.length - 1]?.href;
  const isFavorited = useMemo(() => favoritePages.find(({ pathname, favorite }) => favorite && pathname === leafHref), [favoritePages, leafHref]);

  useEffect(() => {
    setisOpenshift(segments[0] && segments[0].title === 'OpenShift');
  }, [segments]);
  const [isOpenshift, setisOpenshift] = useState(false);

  return (
    <PageBreadcrumb hasBodyWrapper={false} className="chr-c-breadcrumbs pf-v6-u-p-0 pf-v6-u-w-100">
      <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between pf-v6-u-pt-sm pf-v6-u-pb-0 pf-v6-u-pl-lg">
        <FlexItem className="pf-v6-u-flex-grow-1">
          <Breadcrumb className="pf-v6-u-pt-sm">
            {segments.map(({ title, href }, index) => (
              <BreadcrumbItem
                to={href}
                component={(props) => <ChromeLink {...props} className={classNames(props.className, 'chr-c-breadcrumbs__link')} title={title} href={href} />}
                key={index}
                isActive={segments.length - 1 === index}
                className="pf-v6-u-pb-sm"
              >
                {title}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </FlexItem>
        {isOpenshift && (
          <FlexItem>
            <OpenShiftIntercomModule />
          </FlexItem>
        )}
        {leafHref && (
          <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }}>
            <BreadcrumbsFavorites favoritePage={() => favoritePage(leafHref)} unfavoritePage={() => unfavoritePage(leafHref)} isFavorited={!!isFavorited} />
          </FlexItem>
        )}
      </div>
    </PageBreadcrumb>
  );
};

export default Breadcrumbs;
