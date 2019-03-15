import React, { Component } from 'react';
import { Avatar } from '@patternfly/react-core/dist/esm/components/Avatar';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class UserIcon extends Component {

    render() {
        const { account } = this.props;

        // If a user has an image, it gets returned as 140x140px
        // Check to see if the user has an image by looking at the width
        const img = new Image();
        img.src = `https://access.redhat.com/api/users/avatar/${account.login}/`;

        const fallback = 'apps/chrome/assets/images/img_avatar.svg';
        return (
            <Avatar src={ img.width === 140 ? img.src : fallback }/>
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
