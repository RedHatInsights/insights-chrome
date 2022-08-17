import React from 'react';
import * as ReactIntl from 'react-intl';

const FormattedMessage = ({ defaultMessage = '' }) => <>{defaultMessage}</>;

module.exports = {
  __esModule: true,
  ...ReactIntl,
  FormattedMessage,
  default: {
    ...ReactIntl,
    FormattedMessage,
  },
};
