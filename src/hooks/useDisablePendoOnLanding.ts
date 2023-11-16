import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ReduxState } from '../redux/store';
import { isProd } from '../utils/common';
import { isITLessEnv } from '../utils/consts';

// interval timing is short because we want to catch the bubble before ASAP so it does not cover the VA button
const RETRY_ATTEMPS = 500;
const RETRY_INTERVAL = 50;

const useDisablePendoOnLanding = () => {
  const activeModule = useSelector((state: ReduxState) => state.chrome.activeModule);

  const toggleGuides = () => {
    if (window.pendo && activeModule === 'landing') {
      window.pendo.stopGuides();
    } else {
      window.pendo?.startGuides();
    }
  };

  useEffect(() => {
    let attempt = 0;
    let interval: NodeJS.Timeout | undefined = undefined;
    if (window.pendo) {
      toggleGuides();
    } else {
      interval = setInterval(() => {
        if (attempt < RETRY_ATTEMPS) {
          attempt += 1;
          if (window.pendo) {
            clearInterval(interval);
            toggleGuides();
          }
        } else {
          clearInterval(interval);
        }
      }, RETRY_INTERVAL);
    }

    return () => {
      if (interval && !isProd() && !isITLessEnv) {
        clearInterval(interval);
      }
    };
  }, [activeModule]);
};

export default useDisablePendoOnLanding;
