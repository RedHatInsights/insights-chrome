import React from 'react';
import { Button, Text, TextVariants } from '@patternfly/react-core';
import ArrowRightIcon from '@patternfly/react-icons/dist/js/icons/arrow-right-icon';
import './Banner.scss';

const bannerContent = {
    title: 'Changes are coming to cloud.redhat.com on July 29',
    link: {
        title: 'Learn more on our blog',
        href: '#'
    }
}

const Banner = () => (
  <div className="ins-c-banner pf-u-display-flex pf-u-justify-content-center pf-u-align-items-center">
    <Text component={TextVariants.h3}>{bannerContent.title}</Text>
    <Button variant="link" isLarge component="a" href={bannerContent.link.href} target="_blank">
        {bannerContent.link.title} <ArrowRightIcon />
    </Button>
  </div>
);

export default Banner;
