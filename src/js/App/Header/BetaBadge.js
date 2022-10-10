import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '@patternfly/react-core';
import classNames from 'classnames';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const BetaBadge = ({ className, ...props }) => {
  const intl = useIntl();

  return (
    <Badge className={classNames('chr-c-toolbar__beta-badge', className)} {...props}>
      {intl.formatMessage(messages.beta)}
    </Badge>
  );
};

BetaBadge.propTypes = {
  className: PropTypes.string,
};

export default BetaBadge;
