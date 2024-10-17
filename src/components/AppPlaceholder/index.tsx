import { Masthead, MastheadBrand, MastheadMain } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page, PageSidebar, PageSidebarBody } from '@patternfly/react-core/dist/dynamic/components/Page';

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ChromeLink from '../ChromeLink';
import ChromeFooter from '../Footer/Footer';
import Logo from '../Header/Logo';
import NavLoader from '../Navigation/Loader';
import { getUrl } from '../../hooks/useBundle';
import LoadingFallback from '../../utils/loading-fallback';

// Component that is displayed as a placeholder before auth init is finished
const AppPlaceholder = () => {
  const hideNavLoader = [undefined, '', 'landing', 'allservices', 'favoritedservices'].includes(getUrl('bundle'));
  return (
    <MemoryRouter>
      <Page
        className="chr-c-page"
        header={
          <Masthead className="chr-c-masthead">
            <MastheadMain className="pf-v6-u-pl-lg">
              <MastheadBrand component={(props) => <ChromeLink {...props} appId="landing" href="/" />}>
                <Logo />
              </MastheadBrand>
            </MastheadMain>
          </Masthead>
        }
        sidebar={
          hideNavLoader ? undefined : (
            <PageSidebar>
              <PageSidebarBody>
                <NavLoader />
              </PageSidebarBody>
            </PageSidebar>
          )
        }
      >
        <div className="chr-render">
          {LoadingFallback}
          <ChromeFooter />
        </div>
      </Page>
    </MemoryRouter>
  );
};

export default AppPlaceholder;
