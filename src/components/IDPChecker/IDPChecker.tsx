import React, { Fragment, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

import { ITLess } from '../../utils/common';
import IDPError from '../ErrorComponents/IDPError';
import { ReduxState } from '../../redux/store';

const IDPStatuses = {
  OK: 'OK',
  UNKNOWN: 'UNKNOWN',
  PENDING: 'PENDING',
  ERROR: 'ERROR',
};

const IDPChecker: React.FunctionComponent = ({ children }) => {
  const ITLessEnv = ITLess();
  const missingIDP = useSelector(({ chrome }: ReduxState) => chrome?.missingIDP);
  const [status, setStatus] = useState(() => {
    if (ITLessEnv) {
      return missingIDP === true ? IDPStatuses.ERROR : IDPStatuses.UNKNOWN;
    }
    return IDPStatuses.OK;
  });
  const hasUser = useSelector(({ chrome: { user } }: ReduxState) => Object.keys(user || {}).length > 0);
  const allowStateChange = useRef(ITLessEnv);

  useEffect(() => {
    if (ITLessEnv && status !== IDPStatuses.PENDING && hasUser) {
      allowStateChange.current && setStatus(IDPStatuses.PENDING);
      axios
        .get('/api/entitlements/v1/services')
        .then(() => {
          allowStateChange.current && setStatus(IDPStatuses.OK);
        })
        .catch((err) => {
          const authError = err.response.status === 403 && err.message === 'Insights authorization failed - account number not in allow list';
          allowStateChange.current && setStatus(authError ? IDPStatuses.ERROR : IDPStatuses.OK);
        });
    }
  }, [hasUser, missingIDP]);

  useEffect(() => {
    if (missingIDP === true) {
      allowStateChange.current && setStatus(IDPStatuses.ERROR);
      allowStateChange.current = false;
    }
  }, [missingIDP]);

  if (status === IDPStatuses.OK) {
    return <Fragment>{children}</Fragment>;
  }
  if (status === IDPStatuses.ERROR) {
    return <IDPError />;
  }
  return null;
};

export default IDPChecker;
