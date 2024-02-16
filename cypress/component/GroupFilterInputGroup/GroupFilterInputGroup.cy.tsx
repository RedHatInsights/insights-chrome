import React from 'react';
import { IntlProvider } from 'react-intl';
import GroupFilterInputGroup from '../../../src/components/GlobalFilter/GroupFilterInputGroup';

const initialProps = {
  isDisabled: false,
  filter: {
    onChange: () => null,
  },
  setIsOpen: () => null,
  selectedTags: {
    key: {},
  },
};

describe('<GroupFilterInputGroup />', () => {
  it('should open Popover with Tags help', () => {
    function openPopover() {
      cy.get('[aria-label="Tags help"]').click();
      cy.contains('Tags').should('exist');
    }
    cy.mount(
      <IntlProvider locale="en">
        <GroupFilterInputGroup
          isDisabled={initialProps.isDisabled}
          filter={initialProps.filter}
          setIsOpen={initialProps.setIsOpen}
          selectedTags={initialProps.selectedTags}
        />
      </IntlProvider>
    );

    openPopover();
  });
});
