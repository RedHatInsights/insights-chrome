import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ReduxState } from '../redux/store';
import { isProd } from '../utils/common';
import { isITLessEnv } from '../utils/consts';

// interval timing is short because we want to catch the bubble before ASAP so it does not cover the VA button
const RETRY_ATTEMPS = 500;
const RETRY_INTERVAL = 50;

function retry(fn: () => void, retriesLeft = 10, interval = 100) {
  try {
    return fn();
  } catch (error) {
    console.error(error);
    const newRetry = retriesLeft - 1;
    if (newRetry > 0) {
      setTimeout(() => {
        retry(fn, newRetry, interval);
      }, interval);
    }
  }
}

const useDisablePendoOnLanding = () => {
  const activeModule = useSelector((state: ReduxState) => state.chrome.activeModule);

  const toggleGuides = () => {
    // push the call to the end of the event loop to make sure the pendo script is loaded and initialized
    setTimeout(() => {
      if (window.pendo && activeModule === 'landing') {
        // pendo functions might not be ready for what ever reason, we will have to retry a few times to give it a shot
        retry(() => {
          window.pendo?.setGuidesDisabled?.(true);
          window.pendo?.stopGuides?.();
        });
      } else if (window.pendo) {
        retry(() => {
          window.pendo?.setGuidesDisabled?.(false);
          window.pendo?.startGuides?.();
        });
      }
    });
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
