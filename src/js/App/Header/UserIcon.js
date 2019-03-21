import React, { Component } from 'react';
import { Avatar } from '@patternfly/react-core/dist/esm/components/Avatar';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class UserIcon extends Component {

    constructor(props) {
        super(props);
        this.state = {
            account: this.props.account,
            avatar: ''
        };
    }

    getImage = (img) => {
        if (img.width === 140) {;
            this.setState({ avatar: img.src });
        } else {
            this.setState({ avatar: 'apps/chrome/assets/images/img_avatar.svg' });
        }
    }

    componentDidMount() {
        const img = new Image();
        img.src = `https://access.redhat.com/api/users/avatar/${this.state.account.login}/`;
        img.onload = (() => this.getImage(img));
    }

    render() {
        const { avatar } = this.state;

        return (
            <Avatar src={ avatar }/>
        );
    }
}

UserIcon.propTypes = {
    account: PropTypes.shape({
        login: PropTypes.string
    })
};

export default connect(({ chrome: { user: { login } } }) => ({
    account: {
        login: login
    }
}))(UserIcon);
