import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import React from 'react';
import ChromeLink from '../ChromeLink';

import './EmptyState.scss';

const EmptyState = () => (
  <>
    <Flex className="pf-v6-u-justify-content-center pf-v6-u-align-items-stretch">
      <Stack className="pf-v6-u-justify-content-center">
        <StackItem className="pf-v6-u-text-align-center">
          <img src="/apps/frontend-assets/background-images/favoriting-emptystate.svg" className="chr-c-empty-state-favorites" alt="favoriting image" />
        </StackItem>
        <StackItem className="pf-v6-u-text-align-center">
          <Content>
            <Content component="h3" className="pf-v6-m-center">
              No favorited services
            </Content>
            <Content component="small" className="pf-v6-u-mt-sm">
              Add a service to your favorites to get started here.
            </Content>
          </Content>
        </StackItem>
        <StackItem className="pf-v6-u-text-align-center pf-v6-u-mt-md">
          <Button variant="primary" alt="View all services" component={(props) => <ChromeLink {...props} href="/allservices" />}>
            View all services
          </Button>
        </StackItem>
      </Stack>
    </Flex>
  </>
);

export default EmptyState;
