import React, { Component } from 'react';
import { Avatar } from '@patternfly/react-core4/dist/js/components/Avatar/Avatar';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

export class UserIcon extends Component {

    constructor(props) {
        super(props);
        this.state = {
            account: this.props.account,
            avatar: 'apps/chrome/assets/images/img_avatar.svg'
        };
    }

    getImage = (img) => {
        if (img.width === 140) {
            this.setState({ avatar: img.src });
        }
    }

    componentDidMount() {
        const img = new Image();
        img.src = `https://access.redhat.com/api/users/avatar/${this.state.account.username}/`;
        img.onload = (() => this.getImage(img));
    }

    render() {
        const { avatar } = this.state;

        return (
            <Avatar src={ avatar } alt='User Avatar'/>
        );
    }
}

UserIcon.propTypes = {
    account: PropTypes.shape({
        username: PropTypes.string
    })
};

export default connect(({ chrome: { user: { identity: { user: { username } } } } }) => ({
    account: {
        username: username
    }
}))(UserIcon);
