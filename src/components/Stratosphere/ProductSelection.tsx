import React from 'react';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import CheckCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/check-circle-icon';

import productsList from './products-list';
import ProductCard from './ProductCard';
import { Header } from '../Header/Header';
import ChromeLink from '../ChromeLink/ChromeLink';
import Footer from './Footer';
import useMarketplacePartner from '../../hooks/useMarketplacePartner';

import './product-selection.scss';

const ProductSelection = () => {
  const { partner, partnerId } = useMarketplacePartner();
  return (
    <div id="chrome-app-render-root">
      <Page
        masthead={
          <Masthead className="chr-c-masthead">
            <Header />
          </Masthead>
        }
      >
        <div className="chr-c-product-selection pf-u-pt-lg pf-u-pb-lg">
          <Stack hasGutter>
            <StackItem>
              <Bullseye>
                <Icon size="xl">
                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                </Icon>
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
                    your Red Hat and {partner} accounts are connected and you can now access Red Hat support resources
                  </Title>
                </StackItem>
              </Stack>
            </StackItem>
            {partnerId !== 'from-azure' && (
              <>
                <StackItem>
                  <Bullseye>
                    <Content>
                      <Content component="p">To get started using your Red Hat products, follow the links below</Content>
                    </Content>
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
              </>
            )}
            <StackItem>
              <Bullseye>
                <Content>
                  <Content component="p">
                    To manage or learn more about your Red Hat subscriptions, visit{' '}
                    <ChromeLink href="/insights/subscriptions/rhel" appId="subscriptions">
                      subscriptions.
                    </ChromeLink>
                  </Content>
                </Content>
              </Bullseye>
            </StackItem>
          </Stack>
        </div>
        <Footer />
      </Page>
    </div>
  );
};

export default ProductSelection;
