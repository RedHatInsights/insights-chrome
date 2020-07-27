import React from 'react';
import { NavItem } from '@patternfly/react-core/dist/js/components/Nav/NavItem';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const basepath = document.baseURI;

const NavigationItem = ({ itemID, title, parent, navigate, ignoreCase, ...props }) => (
    <NavItem
        {...props}
        itemId={itemID}
        className={classNames({ 'ins-m-ignore-case': ignoreCase })}
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
    parent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ignoreCase: PropTypes.bool
};

NavigationItem.defaultProps = {
    parent: ''
};

export default NavigationItem;
