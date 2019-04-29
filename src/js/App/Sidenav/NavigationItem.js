import React from 'react';
import { NavItem } from '@patternfly/react-core/dist/esm/components/Nav';

const basepath = document.baseURI;

export default ({ itemID, title, parent = '', navigate, ...props }) => (
    <NavItem
        {...props}
        itemId={itemID}
        preventDefault
        to={navigate || `${basepath}${parent}/${itemID}`}
    >
        {title}
    </NavItem>
);
