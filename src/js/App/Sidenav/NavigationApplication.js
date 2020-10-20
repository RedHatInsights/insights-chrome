import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavExpandable } from '@patternfly/react-core/dist/js/components/Nav/NavExpandable';
import NavigationItem from './NavigationItem';
import axios from 'axios';

const asyncNavMethod = (url, config = {}) =>
  window.insights.chrome.auth.getUser().then(() => {
    axios({
      url,
      ...config,
      method: config.method || 'GET',
    });
  });

const NavigationApplication = ({ subItems, onClick, title, id, active, ignoreCase, dynamic, activeLocation, activeApp }) => {
  const [dynamicSubItems, setDynamicSubItems] = useState();
  useEffect(() => {
    if (dynamic) {
      asyncNavMethod(dynamic.url, dynamic.config).then(setDynamicSubItems);
    }
  }, []);

  const completeSubItems = [...(subItems || []), ...(dynamicSubItems || [])];

  if (completeSubItems.length > 0) {
    return (
      <NavExpandable className="ins-m-navigation-align" title={title} id={id} itemID={id} ouiaId={id} isActive={active} isExpanded={active}>
        {completeSubItems.map((subItem, subKey) => (
          <NavigationItem
            ignoreCase={subItem.ignoreCase}
            itemID={subItem.reload || subItem.id}
            ouiaId={subItem.reload || subItem.id}
            key={subKey}
            title={subItem.title}
            parent={subItem.reload ? activeLocation : `${activeLocation}${id ? `/${id}` : ''}`}
            isActive={active && subItem.id === activeApp}
            onClick={(event) => onClick(event, subItem)}
          />
        ))}
      </NavExpandable>
    );
  }
  return (
    <NavigationItem
      ignoreCase={ignoreCase}
      itemID={id}
      ouiaId={id}
      title={title}
      parent={activeLocation}
      isActive={active || id === activeApp}
      onClick={onClick}
    />
  );
};

NavigationApplication.propTypes = {
  subItems: PropTypes.array,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  id: PropTypes.string.isRequired,
  ignoreCase: PropTypes.bool,
  activeLocation: PropTypes.string.isRequired,
  activeApp: PropTypes.string,
  active: PropTypes.bool,
  dynamic: PropTypes.shape({
    config: PropTypes.object,
    method: PropTypes.oneOf(['async']).isRequired,
    url: PropTypes.string.isRequired,
    args: PropTypes.any,
  }),
};

export default NavigationApplication;
