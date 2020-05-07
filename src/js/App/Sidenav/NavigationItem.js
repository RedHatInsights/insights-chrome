import React from 'react';
import { NavItem } from '@patternfly/react-core';
import PropTypes from 'prop-types';

const basepath = document.baseURI;

const NavigationItem = ({ itemID, title, parent, navigate, ...props }) => (
    <NavItem
        {...props}
        itemId={itemID}
        preventDefault
        to={navigate || `${basepath}${parent}/${itemID}`}
    >
        {title}
    </NavItem>
);

NavigationItem.propTypes = {
    itemID: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.node,
    navigate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    parent: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

NavigationItem.defaultProps = {
    parent: ''
};

export default NavigationItem;
