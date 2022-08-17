import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const TestComponent = () => {
  return <FormattedMessage defaultMessage="Foo bar" id="a.id" />;
};

export default TestComponent;
