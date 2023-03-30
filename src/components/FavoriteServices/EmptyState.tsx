import { Button, StackItem, Text, TextContent } from '@patternfly/react-core';
import React from 'react';
import ChromeLink from '../ChromeLink';

import './EmptyState.scss';

const EmptyState = () => (
  <>
    <StackItem className="chr-l-stack__item-centered pf-u-mt-xl">
      <img src="https://console.redhat.com/apps/frontend-assets/favoritedservices/favoriting-emptystate.svg" alt="favoriting image" />
    </StackItem>
    <StackItem className="chr-l-stack__item-centered pf-u-mt-md">
      <TextContent>
        <Text component="h3" className="pf-m-center">
          No favorited services
        </Text>
        <Text component="small" className="pf-u-mt-sm">
          Add a service to your favorites to get started here.
        </Text>
      </TextContent>
    </StackItem>
    <StackItem className="chr-l-stack__item-centered pf-u-mt-md">
      <Button variant="primary" alt="View all services" component={(props) => <ChromeLink {...props} href="/allservices" />}>
        View all services
      </Button>
    </StackItem>
  </>
);

export default EmptyState;
