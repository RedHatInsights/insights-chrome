import React from 'react';
import { Bullseye, Flex, Masthead, Page, Stack, StackItem, Text, TextContent, Title } from '@patternfly/react-core';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';

import productsList from './products-list';
import ProductCard from './ProductCard';
import { Header } from '../Header/Header';
import ChromeLink from '../ChromeLink/ChromeLink';
import Footer from './Footer';

import './product-selection.scss';

const ProductSelection = () => (
  <div id="chrome-app-render-root">
    <Page
      header={
        <Masthead className="chr-c-masthead">
          <Header />
        </Masthead>
      }
    >
      <div className="chr-c-product-selection pf-u-pt-lg pf-u-pb-lg">
        <Stack hasGutter>
          <StackItem>
            <Bullseye>
              <CheckCircleIcon size="xl" color="var(--pf-global--success-color--100)" />
            </Bullseye>
          </StackItem>
          <StackItem>
            <Stack>
              <StackItem>
                <Bullseye>
                  <Title size="3xl" headingLevel="h1">
                    Congratulations,
                  </Title>
                </Bullseye>
              </StackItem>
              <StackItem>
                <Title className="chr-c-product-selection__description" size="3xl" headingLevel="h1">
                  your Red Hat and AWS accounts are connected and you can now access Red Hat support resources
                </Title>
              </StackItem>
            </Stack>
          </StackItem>
          <StackItem>
            <Bullseye>
              <TextContent>
                <Text>To get started using your Red Hat products, follow the links below</Text>
              </TextContent>
            </Bullseye>
          </StackItem>
          <StackItem>
            <Flex>
              <div className="chr-c-product-selection__layout">
                {productsList.map((item, i) => (
                  <ProductCard key={i} {...item} order={i} />
                ))}
              </div>
            </Flex>
          </StackItem>
          <StackItem>
            <Bullseye>
              <TextContent>
                <Text>
                  To manage or learn more about your Red Hat subscriptions, visit{' '}
                  <ChromeLink href="/insights/subscriptions/rhel" appId="subscriptions">
                    subscriptions.
                  </ChromeLink>
                </Text>
              </TextContent>
            </Bullseye>
          </StackItem>
        </Stack>
      </div>
      <Footer />
    </Page>
  </div>
);

export default ProductSelection;
