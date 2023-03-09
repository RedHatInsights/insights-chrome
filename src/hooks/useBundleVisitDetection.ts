import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { VisitedBundles, useVisitedBundles } from '@redhat-cloud-services/chrome';
import { getUrl } from '../utils/common';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { ReduxState } from '../redux/store';

// TMP Insights specific trigger
const shouldSendVisit = (bundle: string, visits: VisitedBundles) => bundle === 'insights' && !visits[bundle];

const sendVisitedBundle = async (orgId: string) => {
  axios.post('/api/insights/v1/weeklyreportautosubscribe/', {
    org_id: orgId,
    is_auto_subscribed: true,
  });
};

const useBundleVisitDetection = () => {
  const { pathname } = useLocation();
  const orgId = useSelector(({ chrome: { user } }: ReduxState) => user?.identity?.org_id);
  const { markVisited, visitedBundles, initialized } = useVisitedBundles();
  const bundle = useMemo(() => getUrl('bundle'), [pathname]);
  useEffect(() => {
    // wait for user profile to be ready before any actions
    if (initialized) {
      if (shouldSendVisit(bundle, visitedBundles) && orgId) {
        sendVisitedBundle(orgId);
      }
      if (bundle?.length > 0 && orgId) {
        markVisited(bundle);
      }
    }
  }, [bundle, orgId, initialized]);
};

export default useBundleVisitDetection;
