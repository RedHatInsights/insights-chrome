import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { loadLeftNavSegment } from '../redux/actions';
import { isBeta } from '../utils';

const fileMapper = {
  insights: 'rhel-navigation.json',
};

const useNavigation = () => {
  const isBetaEnv = isBeta();
  const dispatch = useDispatch();
  const schema = useSelector(
    ({
      chrome: {
        navigation: { insights },
      },
    }) => insights
  );
  const { pathname } = useLocation();
  const currentNamespace = pathname.split('/')[1];

  useEffect(() => {
    if (currentNamespace) {
      axios.get(`${window.location.origin}${isBetaEnv ? '/beta' : ''}/config/chrome/${fileMapper[currentNamespace]}`).then((response) => {
        dispatch(loadLeftNavSegment(response.data, currentNamespace));
      });
    }
  }, [currentNamespace]);
  return {
    loaded: !!schema,
    schema,
  };
};

export default useNavigation;
