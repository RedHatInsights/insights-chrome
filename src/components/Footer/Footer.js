import { Button, Modal, ModalVariant, PageSection, Text, TextContent, TextList, TextListItem, TextVariants } from '@patternfly/react-core';
import React, { useState } from 'react';

import './Footer.scss';

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <React.Fragment>
      <PageSection className="pf-m-no-fill">
        <footer role="contentinfo" id="hcc-footer" className="chr-c-footer pf-l-flex pf-m-column pf-m-row-on-lg pf-m-align-items-center-on-lg">
          <a href="https://www.redhat.com" target="_blank" rel="noopener noreferrer">
            <img
              src="https://console.redhat.com/apps/frontend-assets/console-logos/Logo-Red_Hat-A-Standard-RGB.svg"
              alt="Red Hat logo"
              width="145px"
              height="613px"
            />
          </a>
          <div
            className="
            pf-l-flex pf-m-column
            pf-m-row-on-lg
            pf-m-flex-1-on-lg
            pf-m-justify-content-flex-end-on-lg"
          >
            <p className="pf-u-color-200 pf-u-font-size-sm pf-m-spacer-xl-on-lg">©2023 Red Hat, Inc.</p>
            <ul className="pf-u-font-size-sm pf-l-flex pf-m-column pf-m-row-on-md">
              <li>
                <Button variant="link" className="pf-u-p-0" onClick={() => setIsModalOpen(true)} isInline>
                  Browser Support
                </Button>
              </li>
              <li>
                <a href="https://www.redhat.com/en/about/privacy-policy">Privacy Policy</a>
              </li>
              <li>
                <a href="https://access.redhat.com/help/terms/">Terms of Use</a>
              </li>
              <li>
                <a href="https://www.redhat.com/en/about/all-policies-guidelines">All Policies and Guidelines</a>
              </li>
              <li>
                <a id="teconsent"></a>
              </li>
            </ul>
          </div>
        </footer>
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
          <TextList className>
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
