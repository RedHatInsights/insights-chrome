import * as ReactIntl from 'react-intl';

const FormattedMessage = ({ defaultMessage = '' }) => defaultMessage;
const useIntl = () => ({
  formatMessage: (props) => props?.defaultMessage ?? '',
});

module.exports = {
  __esModule: true,
  ...ReactIntl,
  FormattedMessage,
  useIntl,
};
