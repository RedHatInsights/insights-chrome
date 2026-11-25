import React from 'react';
import { IntlProvider } from 'react-intl';
import GroupFilterInputGroup from '../../../src/components/GlobalFilter/GroupFilterInputGroup';
import messages from '../../../src/locales/Messages';

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

  it('preserves translated link order and destinations in the tag-help popover', () => {
    cy.mount(
      <IntlProvider
        locale="fr"
        messages={{
          // Synthetic text tests catalog overrides and movable tags, not translation quality.
          [messages.filterByTagsPopoverContent.id]:
            'See <ClientConfigurationGuideLink>the guide</ClientConfigurationGuideLink> first, then <SatelliteLink>import tags</SatelliteLink>.',
        }}
      >
        <GroupFilterInputGroup {...initialProps} />
      </IntlProvider>
    );

    cy.get('button[aria-label="Tags help"]').click();
    cy.get('[role="dialog"]')
      .should('be.visible')
      .within(() => {
        cy.contains('div', /^See the guide first, then import tags\.$/).should('be.visible');
        cy.get('a').should('have.length', 2);
        cy.get('a')
          .eq(0)
          .should('have.text', 'the guide')
          .and(
            'have.attr',
            'href',
            'https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html-single/client_configuration_guide_for_red_hat_lightspeed/index#proc-lightspeed-creating-custom-group-tags-yaml-file_lightspeed-cg-adding-tags'
          );
        cy.get('a')
          .eq(1)
          .should('have.text', 'import tags')
          .and(
            'have.attr',
            'href',
            'https://docs.redhat.com/en/documentation/subscription_central/1-latest/html-single/getting_started_with_the_subscriptions_service/index#proc-installing-satellite-inventory-upload-plugin_assembly-about-subscriptionwatch'
          );
        cy.get('a').each(($link) => {
          cy.wrap($link).should('have.attr', 'target', '_blank').and('have.attr', 'rel', 'noreferrer');
        });
      });
  });
});
