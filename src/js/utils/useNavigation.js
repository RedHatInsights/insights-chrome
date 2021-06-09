import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { loadLeftNavSegment } from '../redux/actions';
import { isBeta } from '../utils';

const fileMapper = {
  insights: 'rhel-navigation.json',
  ansible: 'ansible-navigation.json',
  settings: 'settings-navigation.json',
  'user-preferences': 'user-preferences-navigation.json',
  openshift: 'openshift-navigation.json',
  'application-services': 'application-services-navigation.json',
};

const useNavigation = () => {
  const isBetaEnv = isBeta();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const currentNamespace = pathname.split('/')[1];
  const schema = useSelector(({ chrome: { navigation } }) => navigation[currentNamespace]);

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
