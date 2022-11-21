import { useEffect } from 'react';
import { spinUpStore } from '../../redux/redux-config';
import { setPendoFeedbackFlag } from '../../redux/actions';

const usePendoFeedback = () => {
  /**
   * We have to use the "spinUpStore" instead of just calling useDispatch
   * Otherwise we will end up using the "dispatch" instance from the application not chrome!
   */
  const {
    store: { dispatch },
  } = spinUpStore();

  useEffect(() => {
    dispatch(setPendoFeedbackFlag(true));
    return () => {
      dispatch(setPendoFeedbackFlag(false));
    };
  }, []);
};

export default usePendoFeedback;
