import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { usePendoFeedbackAtom } from '../../state/atoms/feedbackModalAtom';

const usePendoFeedback = () => {
  /**
   * We have to use the "spinUpStore" instead of just calling useDispatch
   * Otherwise we will end up using the "dispatch" instance from the application not chrome!
   */
  const [, setPendoFeedback] = useAtom(usePendoFeedbackAtom);

  useEffect(() => {
    setPendoFeedback(true);
    return () => {
      setPendoFeedback(false);
    };
  }, [setPendoFeedback]);
};

export default usePendoFeedback;
