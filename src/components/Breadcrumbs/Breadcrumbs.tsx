import { Breadcrumb, BreadcrumbItem, FlexItem, MastheadToggle, PageBreadcrumb, PageToggleButton } from '@patternfly/react-core';
import React from 'react';
import { useDispatch } from 'react-redux';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';
import { onToggle } from '../../redux/actions';

import './Breadcrumbs.scss';

export type Breadcrumbsprops = {
  isNavOpen?: boolean;
  hideNav?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Breadcrumbs = ({ hideNav, isNavOpen, setIsNavOpen }: Breadcrumbsprops) => {
  const dispatch = useDispatch();
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
            <BreadcrumbItem to="#">Section home</BreadcrumbItem>
            <BreadcrumbItem to="#">Section title</BreadcrumbItem>
            <BreadcrumbItem to="#">Section title</BreadcrumbItem>
            <BreadcrumbItem to="#" isActive>
              Section landing
            </BreadcrumbItem>
          </Breadcrumb>
        </FlexItem>
      </div>
    </PageBreadcrumb>
  );
};

export default Breadcrumbs;
