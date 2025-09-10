import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Level, LevelItem } from '@patternfly/react-core/dist/dynamic/layouts/Level';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { VoidFunctionComponent } from 'react';

import './footer.scss';

const currentYear = new Date().getFullYear();

const FooterLink: VoidFunctionComponent<{ href: string; label: React.ReactNode }> = ({ href, label }) => (
  <Content>
    <Content component="small">
      <a className="chr-c-footer__link" href={href}>
        {label}
      </a>
    </Content>
  </Content>
);

const Footer = () => (
  <div className="chr-c-footer">
    <Level>
      <LevelItem>
        <img className="chr-c-footer__logo pf-v6-u-mr-3xl" src="/apps/frontend-assets/red-hat-logos/logo.svg" />
      </LevelItem>
      <LevelItem className="pf-v6-u-mr-2xl">
        <Content>
          <Content component="small">Copyright c {currentYear} Red Hat, Inc.</Content>
        </Content>
      </LevelItem>
      <LevelItem className="pf-v6-u-mr-auto">
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
