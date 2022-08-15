import React from 'react';
import Banner from '../../src/js/App/Banners/Banner'

describe('<Banner />', () => {
  it('mounts', () => {
    const elem = cy.mount(<Banner />).get('html')
    elem.matchImageSnapshot()
  })
})