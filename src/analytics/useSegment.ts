import { useContext } from 'react';
import { useIntl } from 'react-intl';

import messages from '../locales/Messages';
import SegmentContext from './SegmentContext';

export function useSegment() {
  const intl = useIntl();
  const ctx = useContext(SegmentContext);
  if (!ctx) {
    throw new Error(`${intl.formatMessage(messages.segmentError)}`);
  }
  return ctx;
}
