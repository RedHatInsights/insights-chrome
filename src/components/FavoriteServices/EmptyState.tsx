import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';

import React from 'react';
import ChromeLink from '../ChromeLink';

import './EmptyState.scss';

const EmptyState = () => (
  <>
    <StackItem className="chr-l-stack__item-centered pf-v5-u-mt-xl">
      <img src="https://console.redhat.com/apps/frontend-assets/favoritedservices/favoriting-emptystate.svg" alt="favoriting image" />
    </StackItem>
    <StackItem className="chr-l-stack__item-centered pf-v5-u-mt-md">
      <TextContent>
        <Text component="h3" className="pf-v5-m-center">
          No favorited services
        </Text>
        <Text component="small" className="pf-v5-u-mt-sm">
          Add a service to your favorites to get started here.
        </Text>
      </TextContent>
    </StackItem>
    <StackItem className="chr-l-stack__item-centered pf-v5-u-mt-md">
      <Button variant="primary" alt="View all services" component={(props) => <ChromeLink {...props} href="/allservices" />}>
        View all services
      </Button>
    </StackItem>
  </>
);

export default EmptyState;
