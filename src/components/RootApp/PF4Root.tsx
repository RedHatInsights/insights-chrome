import { useEffect } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import removePf4Styles from '../../utils/removePf4Styles';

const PF4Root = () => {
  const removePF4 = useFlag('platform.chrome.disable-pf4');
  useEffect(() => {
    if (removePF4) {
      removePf4Styles();
    }
  }, [removePF4]);
  return null;
};

export default PF4Root;
