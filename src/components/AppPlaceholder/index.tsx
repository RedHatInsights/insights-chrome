import { Masthead, MastheadBrand, MastheadMain, Page, PageSidebar } from '@patternfly/react-core';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ChromeLink from '../ChromeLink';
import Footer from '../Footer/Footer';
import Logo from '../Header/Logo';
import NavLoader from '../Navigation/Loader';

// Component that is displayed as a placeholder before auth init is finished
const AppPlaceholder = () => {
  return (
    <MemoryRouter>
      <Page
        header={
          <Masthead className="chr-c-masthead">
            <MastheadMain>
              <MastheadBrand component={(props) => <ChromeLink {...props} appId="landing" href="/" />}>
                <Logo />
              </MastheadBrand>
            </MastheadMain>
          </Masthead>
        }
        sidebar={<PageSidebar nav={<NavLoader />} />}
      >
        <div className="chr-render">
          <Footer cookieElement={null} setCookieElement={() => undefined} />
        </div>
      </Page>
    </MemoryRouter>
  );
};

export default AppPlaceholder;
