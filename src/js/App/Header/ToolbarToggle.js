import React, { Component } from 'react';
import {
    Dropdown,
    DropdownToggle,
    DropdownItem,
    DropdownPosition
} from '@patternfly/react-core';
import PropTypes from 'prop-types';

class ToolbarToggle extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false
        };
        this.onSelect = this.onSelect.bind(this);
        this.onToggle = this.onToggle.bind(this);
    }

    onSelect() {
        this.setState({ isOpen: !this.state.isOpen });
    }

    onToggle(isOpen) {
        this.setState({ isOpen });
    }

    onClick(ev, url, onClick) {
        ev.preventDefault();
        if (url) {
            window.location.href = `${url}`;
        }

        if (onClick) {
            onClick(ev);
        }
    }

    render() {
        // Render the questionmark icon items
        const dropdownItems = this.props.dropdownItems.map(({ url, title, onClick }) =>
            <DropdownItem
                key={title}
                component={ url ? 'a' : 'button' }
                // Because the urls are using 'a', don't use onClick for accessibility
                // If it is a button, use the onClick prop
                {
                ...url ? {
                    href: url,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                } : { onClick: (ev => this.onClick(ev, url, onClick)) }
                }
            >
                { title }
            </DropdownItem>
        );

        const toggle = <DropdownToggle iconComponent={null} onToggle={this.onToggle}>
            <this.props.icon />
        </DropdownToggle>;

        return (
            <Dropdown
                aria-label='Settings'
                position={DropdownPosition.right}
                toggle={toggle}
                isOpen={this.state.isOpen}
                dropdownItems={dropdownItems}
                onSelect={this.onSelect}
                isPlain
            />
        );
    }
}

ToolbarToggle.propTypes = {
    icon: PropTypes.func,
    dropdownItems: PropTypes.array
};

export default ToolbarToggle;
