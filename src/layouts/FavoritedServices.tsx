import React from 'react';

// import {
//   Button,
//   Card,
//   CardBody,
//   CardTitle,
//   Gallery,
//   Icon,
//   Masthead,
//   Page,
//   PageSection,
//   PageSectionVariants,
//   Split,
//   SplitItem,
//   Stack,
//   StackItem,
//   Text,
//   TextContent,
//   TextVariants,
//   Title,
// } from '@patternfly/react-core';

import { Button, Masthead, Page, PageSection, PageSectionVariants, Stack, StackItem, Text, TextContent, Title } from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import Footer from '../components/Footer/Footer';

import ChromeLink from '../components/ChromeLink';
// import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import './FavoritedServices.scss';

const FavoritedServices = () => (
  <div id="chrome-app-render-root">
    <Page
      onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
      header={
        <Masthead className="chr-c-masthead">
          <Header />
        </Masthead>
      }
    >
      <div className="chr-render">
        <RedirectBanner />
        <PageSection variant={PageSectionVariants.light} className="pf-m-fill">
          <Stack className="chr-l-stack-favoritedservices pf-u-background-color-100 pf-u-pl-lg">
            <StackItem className="pf-u-pb-md">
              <Title headingLevel="h2">Favorited Services</Title>
            </StackItem>

            <StackItem className="chr-l-stack__item-centered">
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
              <Button variant="primary" alt="View all services" component={(props) => <ChromeLink {...props} href="/AllServices" />}>
                View all services
              </Button>
            </StackItem>
            {/* <StackItem>
              Get quick access to your favorite services. To add more services to your Favorites, <ChromeLink href="/">browse all Hybrid Cloud Console services.</ChromeLink>
            </StackItem>
            <StackItem className="pf-u-pt-2xl-on-md">
              <Gallery hasGutter>
                <Card isSelectableRaised>
                  <CardBody>
                    <Split>
                      <SplitItem className="pf-m-fill">
                        Service name
                      </SplitItem>
                      <SplitItem>
                        <Icon status="warning">
                          <StarIcon />
                        </Icon>
                      </SplitItem>
                    </Split>
                    <TextContent>
                      <Text component="small">
                        Bundle
                      </Text>
                      <Text component="p">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
                <Card isPlain className="chr-c-card-centered pf-u-background-color-200">
                  <CardBody className="pf-u-pt-lg">
                    <TextContent>
                      <Text component="p">
                        Go to the All Services page to tag your favorites.
                      </Text>
                       <Text component="p">
                         <ChromeLink href="/">View all services</ChromeLink>
                      </Text>
                    </TextContent>
                  </CardBody>
                </Card>
              </Gallery>
            </StackItem>*/}
          </Stack>
        </PageSection>
        <Footer />
      </div>
    </Page>
  </div>
);
export default FavoritedServices;
