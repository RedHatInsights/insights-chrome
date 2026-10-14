import React from 'react';

import { Dialog } from '@rhds/elements/react/rh-dialog/rh-dialog.js';
import { FooterCopyright } from '@rhds/elements/react/rh-footer/rh-footer-copyright.js';
import { FooterUniversal } from '@rhds/elements/react/rh-footer/rh-footer-universal.js';

import '@rhds/elements/rh-footer/rh-footer-lightdom.css';

import CookieConsentElement from './CookieConsentElement';
import './Footer.scss';

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
      <FooterUniversal>
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
          © 2026 Red Hat
        </FooterCopyright>
      </FooterUniversal>
    </React.Fragment>
  );
};

export default ChromeFooter;
