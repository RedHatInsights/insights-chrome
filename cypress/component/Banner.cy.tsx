import React from 'react';
import Banner from '../../src/components/Banners/Banner';
import { IntlProvider } from 'react-intl';

describe('<Banner />', () => {
  it('mounts', () => {
    const elem = cy
      .mount(
        <IntlProvider locale="en">
          <Banner />
        </IntlProvider>
      )
      .get('html');
    elem.matchImageSnapshot();
  });
});
