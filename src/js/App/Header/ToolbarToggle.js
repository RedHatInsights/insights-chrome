import React, { Component } from 'react';
import {
    Dropdown,
    DropdownToggle,
    DropdownItem,
    DropdownPosition
} from '@patternfly/react-core/dist/esm/components/Dropdown';
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

    onClick(_ev, url) {
        window.location = `${document.baseURI}platform/${url}`;
    }

    render() {
        const dropdownItems = this.props.dropdownItems.map(({ url, title }) =>
            <DropdownItem component='button' onClick={ev => this.onClick(ev, url)}>{ title }</DropdownItem>
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
    icon: PropTypes.node,
    dropdownItems: PropTypes.arrayOf(PropTypes.node)
};

export default ToolbarToggle;
