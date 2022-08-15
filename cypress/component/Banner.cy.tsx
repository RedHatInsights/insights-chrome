import React from 'react';
import Banner from '../../src/js/App/Banners/Banner'

describe('<Banner />', () => {
  it('mounts', () => {
    cy.mount(<Banner />)
  })
})