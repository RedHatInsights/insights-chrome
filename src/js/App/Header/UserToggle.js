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

function buildItems(username, accountNumber = -1, extraItems) {
    return [
        <DropdownItem key="Username" isDisabled>
            <dl className='ins-c-dropdown-item__stack'>
                <dt className="ins-c-dropdown-item__stack--header">Username:</dt>
                <dd className="ins-c-dropdown-item__stack--value">{username}</dd>
            </dl>
        </DropdownItem>,
        <React.Fragment key="account wrapper">
            { accountNumber > -1 &&
                <React.Fragment>
                    <DropdownItem key="Account" isDisabled>
                        <dl className='ins-c-dropdown-item__stack'>
                            <dt className="ins-c-dropdown-item__stack--header">Account Number:</dt>
                            <dd className="ins-c-dropdown-item__stack--value">{accountNumber}</dd>
                        </dl>
                    </DropdownItem>
                </React.Fragment>
            }
        </React.Fragment>,
        <DropdownSeparator key="separator" />,
        <DropdownItem key="My Profile" href="https://access.redhat.com/user">
            My Profile
        </DropdownItem>,
        <DropdownItem key="User Management" href="https://www.redhat.com/wapps/ugc/protected/usermgt/userList.html">
            User Management
        </DropdownItem>,
        <DropdownItem key="logout" component="button" onClick={() => window.insights.chrome.auth.logout()}>
            Logout
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
                dropdownItems={buildItems(account.username ,account.number, extraItems)}
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
// TODO update this to use account_id
export default connect(({
    chrome: {
        user: {
            identity: {
                account_number: accountNumber,
                user: {
                    username,
                    first_name,
                    last_name
                }
            }
        }
    } }) => ({
    account: {
        number: accountNumber,
        username: username,
        name: `${first_name} ${last_name}`
    }
}))(UserToggle);

/* eslint-enable camelcase */
