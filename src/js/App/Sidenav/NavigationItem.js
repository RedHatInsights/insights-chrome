import React from 'react';
import { NavItem } from '@patternfly/react-core';

const basepath = document.baseURI;

const NavigationItem = ({ itemID, title, parent = '', navigate, ...props }) => (
    <NavItem
        {...props}
        itemId={itemID}
        preventDefault
        to={navigate || `${basepath}${parent}/${itemID}`}
    >
        {title}
    </NavItem>
);

export default NavigationItem;
