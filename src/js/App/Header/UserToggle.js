import React, { Component } from 'react';
import {
    Dropdown,
    DropdownToggle,
    KebabToggle,
    DropdownItem,
    DropdownSeparator,
    DropdownPosition
} from '@patternfly/react-core/dist/esm/components/Dropdown';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function buildItems(accountNumber = -1, extraItems) {
    return [
        <DropdownItem key="logout" component="button" onClick={() => window.insights.chrome.auth.logout()}>
            Logout
        </DropdownItem>,
        <DropdownSeparator key="separator" />,
        <DropdownItem key="Account" isDisabled>
            <dl className='account-number'>
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

/* eslint-disable camelcase */

export default connect(({
    chrome: {
        user: {
            identity: {
                account_number: accountNumber,
                user: { first_name, last_name }
            }
        }
    } }) => ({
    account: {
        number: accountNumber,
        name: `${first_name} ${last_name}`
    }
}))(UserToggle);

/* eslint-enable camelcase */
