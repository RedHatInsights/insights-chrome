import React, { Component } from 'react';
import {
    Dropdown,
    DropdownToggle,
    KebabToggle,
    DropdownItem,
    DropdownSeparator,
    DropdownPosition
} from '@patternfly/react-core';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function buildItems(accountNumber = -1, extraItems) {
    return [
        <DropdownItem key="logout" component="button" onClick={() => window.insights.chrome.auth.logout()}>
            Logout
        </DropdownItem>,
        <DropdownSeparator key="separator" />,
        <DropdownItem key="Account" isDisabled>
            <dl>
                <dt className="account-number__header">Account Number:</dt>
                <dd className="account-number__value">{accountNumber}</dd>
            </dl>
        </DropdownItem>,
        [...extraItems]
    ];
}

class UserToggle extends Component {
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
        this.setState({
            isOpen
        });
    }

    render() {
        const { isOpen } = this.state;
        const { account, isSmall, extraItems } = this.props;
        const toggle = isSmall ?
            <KebabToggle onToggle={this.onToggle} /> :
            <DropdownToggle onToggle={this.onToggle}>{account.name}</DropdownToggle>;
        return (
            <Dropdown
                position={DropdownPosition.right}
                aria-label="Overflow actions"
                widget-type="InsightsOverflowActions"
                onSelect={this.onSelect}
                toggle={toggle}
                isPlain
                isOpen={isOpen}
                dropdownItems={buildItems(account.number, extraItems)}
            />
        );
    }
}

UserToggle.propTypes = {
    account: PropTypes.shape({
        number: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        name: PropTypes.string
    }),
    isSmall: PropTypes.bool,
    extraItems: PropTypes.arrayOf(PropTypes.node)
};

UserToggle.defaultProps = {
    account: {
        number: 1,
        name: 'Foo'
    },
    isSmall: false,
    extraItems: []
};

export default connect(({ chrome: { user: { account_number: accountNumber, firstName, lastName } } }) => ({
    account: {
        number: accountNumber,
        name: `${firstName} ${lastName}`
    }
}))(UserToggle);
