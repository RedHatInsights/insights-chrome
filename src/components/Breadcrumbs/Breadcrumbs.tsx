import { Breadcrumb, BreadcrumbItem, FlexItem, MastheadToggle, PageBreadcrumb, PageToggleButton } from '@patternfly/react-core';
import React from 'react';
import { useDispatch } from 'react-redux';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';
import { onToggle } from '../../redux/actions';

import useBreadcrumbsLinks from '../../hooks/useBreadcrumbsLinks';
import ChromeLink from '../ChromeLink/ChromeLink';
import './Breadcrumbs.scss';

export type Breadcrumbsprops = {
  isNavOpen?: boolean;
  hideNav?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Breadcrumbs = ({ hideNav, isNavOpen, setIsNavOpen }: Breadcrumbsprops) => {
  const dispatch = useDispatch();
  const segments = useBreadcrumbsLinks();
  return (
    <PageBreadcrumb className="chr-c-breadcrumbs pf-u-pt-0">
      <div className="chr-c-breadcrumbs__alignment">
        <FlexItem>
          {!hideNav && (
            <MastheadToggle>
              <PageToggleButton
                variant="plain"
                aria-label="Global navigation"
                isNavOpen={isNavOpen}
                onNavToggle={() => {
                  setIsNavOpen?.((prev) => !prev);
                  dispatch(onToggle());
                }}
              >
                <BarsIcon size="sm" />
              </PageToggleButton>
            </MastheadToggle>
          )}
        </FlexItem>
        <FlexItem>
          <Breadcrumb>
            {segments.map(({ title, href }, index) => (
              <BreadcrumbItem
                to={href}
                component={(props) => <ChromeLink {...props} title={title} href={href} />}
                key={index}
                isActive={segments.length - 1 === index}
              >
                {title}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </FlexItem>
      </div>
    </PageBreadcrumb>
  );
};

export default Breadcrumbs;
