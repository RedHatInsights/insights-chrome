import { Divider, Flex, FlexItem, Level, LevelItem, Text, TextContent } from '@patternfly/react-core';
import React, { VoidFunctionComponent } from 'react';

import './footer.scss';

const FooterLink: VoidFunctionComponent<{ href: string; label: React.ReactNode }> = ({ href, label }) => (
  <TextContent>
    <Text component="small">
      <a className="chr-c-footer__link" href={href}>
        {label}
      </a>
    </Text>
  </TextContent>
);

const Footer = () => (
  <div className="chr-c-footer">
    <Level>
      <LevelItem>
        <img className="chr-c-footer__logo pf-u-mr-3xl" src="/apps/frontend-assets/red-hat-logos/logo.svg" />
      </LevelItem>
      <LevelItem className="pf-u-mr-2xl">
        <TextContent>
          <Text component="small">Copyright c 2023 Red Hat, Inc.</Text>
        </TextContent>
      </LevelItem>
      <LevelItem className="pf-u-mr-auto">
        <Flex>
          <FlexItem>
            <FooterLink href="https://www.redhat.com/en/about/privacy-policy" label="Privacy statement" />
          </FlexItem>
          <Divider className="chr-c-footer__divider" inset={{ default: 'insetSm' }} orientation={{ default: 'vertical' }} />
          <FlexItem>
            <FooterLink href="https://www.redhat.com/en/about/terms-use" label="Terms of service" />
          </FlexItem>
          <Divider className="chr-c-footer__divider" inset={{ default: 'insetSm' }} orientation={{ default: 'vertical' }} />
          <FlexItem>
            <FooterLink href="https://www.redhat.com/en/about/all-policies-guidelines" label="All policies and guidelines" />
          </FlexItem>
        </Flex>
      </LevelItem>
    </Level>
  </div>
);

export default Footer;
