import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';

import ArrowRightIcon from '@patternfly/react-icons/dist/dynamic/icons/arrow-right-icon';
import './Banner.scss';

const Banner = () => {
  const intl = useIntl();
  const bannerContent = {
    link: {
      href: 'https://www.openshift.com/blog/check-out-our-new-look',
    },
  };
  return (
    <div className="chr-banner">
      <Content component={ContentVariants.h3}>{intl.formatMessage(messages.changesComing)}</Content>
      <Button icon={<ArrowRightIcon />} variant="link" component="a" href={bannerContent.link.href} target="_blank">
        {intl.formatMessage(messages.learnMore)}
      </Button>
    </div>
  );
};

export default Banner;
