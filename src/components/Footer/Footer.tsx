import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Text, TextContent, TextList, TextListItem, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import RedHatIcon from '@patternfly/react-icons/dist/dynamic/icons/redhat-icon';

import './Footer.scss';

export type FooterProps = {
  setCookieElement: Dispatch<SetStateAction<HTMLAnchorElement | null>>;
  cookieElement: Element | null;
};

const Footer = ({ setCookieElement, cookieElement }: FooterProps) => {
  const cookieRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (cookieRef.current) {
      if (cookieElement) {
        cookieRef.current.replaceWith(cookieElement);
      } else {
        setCookieElement(cookieRef.current);
      }
    }
  }, [cookieRef.current]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <React.Fragment>
      <PageSection className="chr-c-footer pf-v5-u-mt-auto pf-v5-u-p-lg pf-v5-m-no-fill pf-v5-u-mt-auto pf-v5-u-background-color-dark-100 pf-v5-u-flex-grow-0">
        <Flex role="contentinfo" className="pf-m-column pf-v5-u-flex-direction-row-on-lg">
          <a href="https://www.redhat.com" target="_blank" rel="noopener noreferrer" className="pf-v5-l-flex">
            <Icon className="pf-v5-u-mx-md pf-v5-u-mt-xs pf-v5-u-mb-md">
              <RedHatIcon />
            </Icon>
          </a>
          <Flex className="pf-m-column pf-v5-u-align-self-flex-start">
            <TextContent className="pf-v5-l-flex pf-v5-u-mb-sm">
              <Text component="p" className="pf-v5-u-color-400 pf-v5-u-font-size-xs">
                ©2023 Red Hat, Inc.
              </Text>
            </TextContent>
            <TextContent className="pf-v5-l-flex pf-m-column pf-v5-u-flex-direction-row-on-md pf-v5-u-font-size-xs">
              <Text component="a" onClick={() => setIsModalOpen(true)}>
                Browser Support
              </Text>
              <Text component="a" href="https://www.redhat.com/en/about/privacy-policy">
                Privacy Policy
              </Text>
              <Text component="a" href="https://access.redhat.com/help/terms/">
                Terms of Use
              </Text>
              <Text component="a" href="https://www.redhat.com/en/about/all-policies-guidelines">
                All Policies and Guidelines
              </Text>
              <a id="teconsent" ref={cookieRef}></a>
            </TextContent>
          </Flex>
        </Flex>
      </PageSection>
      <Modal title="Browser support" isOpen={isModalOpen} variant={ModalVariant.small} onClose={() => setIsModalOpen(false)}>
        <TextContent>
          <Text component="p">
            Red Hat captures and regularly reviews statistical data from our actual web visitors and registered users, rather than generic industry
            data, to identify the browsers we need to support in alignment with our customers’ needs. Additionally, to safeguard customer data, only
            browsers which receive security updates from the browser manufacturer are considered for support. We have implemented this policy to
            ensure that we can provide an excellent experience to a wide user base.
          </Text>
          <Text component={TextVariants.h4}>Cookies and Javascript </Text>
          <Text component="p">
            To successfully interact with our websites and services, your browser must meet the following feature requirements:
          </Text>
          <TextList>
            <TextListItem>The browser must be configured to accept cookies</TextListItem>
            <TextListItem>The browser must be configured to execute JavaScript</TextListItem>
          </TextList>
          <Text component={TextVariants.h4}>Specific browser support </Text>
          <Text component="p">
            We validate against and fully support our customers&#39; use of the past two major releases of the following browsers:
          </Text>
          <TextList>
            <TextListItem>Mozilla Firefox</TextListItem>
            <TextListItem>Google Chrome</TextListItem>
            <TextListItem>Apple Safari</TextListItem>
            <TextListItem>Microsoft Edge</TextListItem>
          </TextList>
        </TextContent>
      </Modal>
    </React.Fragment>
  );
};

export default Footer;
