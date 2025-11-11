import React, { useEffect, useMemo, useRef } from 'react';

import { Cta } from '@rhds/elements/react/rh-cta/rh-cta.js';
import { Dialog } from '@rhds/elements/react/rh-dialog/rh-dialog.js';
import { Footer } from '@rhds/elements/react/rh-footer/rh-footer.js';
import { FooterBlock } from '@rhds/elements/react/rh-footer/rh-footer-block.js';
import { FooterCopyright } from '@rhds/elements/react/rh-footer/rh-footer-copyright.js';
import { FooterSocialLink } from '@rhds/elements/react/rh-footer/rh-footer-social-link.js';
import { FooterUniversal } from '@rhds/elements/react/rh-footer/rh-footer-universal.js';

import '@rhds/elements/rh-footer/rh-footer-lightdom.css';

import './Footer.scss';

const CookieConsentElement = () => {
  // the consent element can be initialized only once, but we render multiple instance of the footer based on the UI state
  // we have to carry the element around the DOM so it does not disappear when the footer is re-initialized
  const consentRef = useRef<HTMLLIElement>(null);
  const consentElement = useMemo(() => {
    return document.getElementById('teconsent');
  }, []);
  useEffect(() => {
    if (consentRef.current && consentElement) {
      consentRef.current.appendChild(consentElement);
    }
  }, [consentElement]);

  return <li ref={consentRef}></li>;
};

const ChromeFooter = () => {
  return (
    <React.Fragment>
      <Dialog trigger="browser-support-link" variant="small">
        <h3 slot="header">Browser Support</h3>
        <p>
          Red Hat captures and regularly reviews statistical data from our actual web visitors and registered users, rather than generic industry data, to
          identify the browsers we need to support in alignment with our customers’ needs. Additionally, to safeguard customer data, only browsers which receive
          security updates from the browser manufacturer are considered for support. We have implemented this policy to ensure that we can provide an excellent
          experience to a wide user base.
        </p>
        <h4>Cookies and Javascript </h4>
        <p>To successfully interact with our websites and services, your browser must meet the following feature requirements:</p>
        <ul>
          <li>The browser must be configured to accept cookies</li>
          <li>The browser must be configured to execute JavaScript</li>
        </ul>
        <h4>Specific browser support </h4>
        <p>We validate against and fully support our customers&#39; use of the past two major releases of the following browsers:</p>
        <ul>
          <li>Mozilla Firefox</li>
          <li>Google Chrome</li>
          <li>Apple Safari</li>
          <li>Microsoft Edge</li>
        </ul>
      </Dialog>
      <Footer>
        <a slot="logo" href="https://redhat.com/en">
          <img alt="Red Hat logo" src="https://static.redhat.com/libs/redhat/brand-assets/2/corp/logo--on-dark.svg" loading="lazy" />
        </a>
        <FooterSocialLink slot="social-links" icon="linkedin">
          <a href="https://www.linkedin.com/company/red-hat">LinkedIn</a>
        </FooterSocialLink>
        <FooterSocialLink slot="social-links" icon="youtube">
          <a href="https://www.youtube.com/user/RedHatVideos">YouTube</a>
        </FooterSocialLink>
        <FooterSocialLink slot="social-links" icon="facebook">
          <a href="https://www.facebook.com/RedHat/">Facebook</a>
        </FooterSocialLink>
        <FooterSocialLink slot="social-links" icon="x">
          <a href="https://twitter.com/RedHat">X/Twitter</a>
        </FooterSocialLink>
        <h3 slot="links">Products</h3>
        <ul slot="links">
          <li>
            <a href="https://redhat.com/en/technologies/linux-platforms/enterprise-linux">Red Hat Enterprise Linux</a>
          </li>
          <li>
            <a href="https://redhat.com/en/technologies/cloud-computing/openshift">Red Hat OpenShift</a>
          </li>
          <li>
            <a href="https://redhat.com/en/technologies/management/ansible">Red Hat Ansible Automation Platform</a>
          </li>
          <li>
            <a href="https://redhat.com/en/technologies/cloud-computing/openshift/cloud-services">Cloud services</a>
          </li>
          <li>
            <a href="https://redhat.com/en/technologies/all-products">See all products</a>
          </li>
        </ul>
        <h3 slot="links">Tools</h3>
        <ul slot="links">
          <li>
            <a href="https://sso.redhat.com">My account</a>
          </li>
          <li>
            <a href="https://redhat.com/en/services/training-and-certification">Training and certification</a>
          </li>
          <li>
            <a href="https://access.redhat.com">Customer support</a>
          </li>
          <li>
            <a href="https://developers.redhat.com/">Developer resources</a>
          </li>
          <li>
            <a href="https://learn.redhat.com/">Learning community</a>
          </li>
          <li>
            <a href="https://connect.redhat.com/">Partner resources</a>
          </li>
          <li>
            <a href="https://redhat.com/en/resources">Resource library</a>
          </li>
        </ul>
        <h3 slot="links">Try, buy & sell</h3>
        <ul slot="links">
          <li>
            <a href="https://redhat.com/en/products/trials">Product trial center</a>
          </li>
          <li>
            <a href="https://catalog.redhat.com/">Red Hat Ecosystem Catalog</a>
          </li>
          <li>
            <a href="http://redhat.force.com/finder/">Find a partner</a>
          </li>
          <li>
            <a href="https://www.redhat.com/en/store">Red Hat Store</a>
          </li>
          <li>
            <a href="https://cloud.redhat.com/">Console</a>
          </li>
        </ul>
        <h3 slot="links">Communicate</h3>
        <ul slot="links">
          <li>
            <a href="https://redhat.com/en/services/consulting-overview#contact-us">Contact consulting</a>
          </li>
          <li>
            <a href="https://redhat.com/en/contact">Contact sales</a>
          </li>
          <li>
            <a href="https://redhat.com/en/services/training-and-certification/contact-us">Contact training</a>
          </li>
          <li>
            <a href="https://redhat.com/en/about/social">Social</a>
          </li>
        </ul>
        <FooterBlock slot="main-secondary">
          <h3 slot="header">About Red Hat</h3>
          <p>
            {' '}
            We’re the world’s leading provider of enterprise open source solutions—including Linux, cloud, container, and Kubernetes. We deliver hardened
            solutions that make it easier for enterprises to work across platforms and environments, from the core datacenter to the network edge.
          </p>
        </FooterBlock>
        <FooterBlock slot="main-secondary">
          <h3 slot="header">Subscribe to our newsletter, Red Hat Shares</h3>
          <Cta>
            <a href="https://www.redhat.com/en/email-preferences?newsletter=RH-Shares&intcmp=7016000000154xCAAQ">Sign up now</a>
          </Cta>
        </FooterBlock>
        <FooterUniversal slot="universal">
          <h3 slot="links-primary" className="pf-v6-u-w-100 pf-v6-u-pb-md">
            About
          </h3>
          <ul slot="links-primary">
            <li>
              <a href="https://redhat.com/en/about/company">About Red Hat</a>
            </li>
            <li>
              <a href="https://redhat.com/en/jobs">Jobs</a>
            </li>
            <li>
              <a href="https://redhat.com/en/events">Events</a>
            </li>
            <li>
              <a href="https://redhat.com/en/about/office-locations">Locations</a>
            </li>
            <li>
              <a href="https://redhat.com/en/contact">Contact Red Hat</a>
            </li>
            <li>
              <a href="https://redhat.com/en/blog">Red Hat Blog</a>
            </li>
            <li>
              <a href="https://redhat.com/en/about/our-culture/inclusion">Inclusion at Red Hat</a>
            </li>
            <li>
              <a href="https://coolstuff.redhat.com/">Cool Stuff Store</a>
            </li>
            <li>
              <a href="https://www.redhat.com/en/summit">Red Hat Summit</a>
            </li>
          </ul>
          <h3 slot="links-secondary" className="pf-v6-u-w-100 pf-v6-u-pb-md">
            Privacy and legal
          </h3>
          <ul slot="links-secondary">
            <li>
              <a href="https://redhat.com/en/about/privacy-policy">Privacy statement</a>
            </li>
            <li>
              <a href="https://redhat.com/en/about/terms-use">Terms of use</a>
            </li>
            <li>
              <a href="https://redhat.com/en/about/all-policies-guidelines">All policies and guidelines</a>
            </li>
            <li>
              <a href="https://redhat.com/en/about/digital-accessibility">Digital accessibility</a>
            </li>
            <li>
              <a href="#" id="browser-support-link">
                Browser support
              </a>
            </li>
            <CookieConsentElement />
          </ul>
          <FooterCopyright slot="links-secondary" className="pf-v6-u-pt-md">
            © 2025 Red Hat
          </FooterCopyright>
        </FooterUniversal>
      </Footer>
    </React.Fragment>
  );
};

export default ChromeFooter;
