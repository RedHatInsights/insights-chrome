import React from 'react';
import { NavItem } from '@patternfly/react-core/dist/esm/components/Nav';

const basepath = `${document.baseURI}platform/`;

export default ({ itemId, title, parent = '', ...props }) => (
    <NavItem {...props} itemId={itemId} preventDefault to={`${basepath}${parent}${itemId}`}>{title}</NavItem>
);
