import { createContext } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';

const SegmentContext = createContext<{ ready: boolean; analytics?: AnalyticsBrowser }>({
  ready: false,
  analytics: undefined,
});

export default SegmentContext;
