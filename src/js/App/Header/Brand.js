import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { onToggle } from '../../redux/actions';
import { Button } from '@patternfly/react-core';
import BarsIcon from '@patternfly/react-icons';
import Logo from './Logo';

const Brand = ({ toggleNav, navHidden }) => (
    <div className="pf-c-page__header-brand">
        <div hidden={navHidden} className='pf-c-page__header-brand-toggle'>
            <Button
                variant="plain"
                aria-label="Toggle primary navigation"
                widget-type="InsightsNavToggle"
                onClick={() => toggleNav && toggleNav()}
            >
                <BarsIcon size="md"/>
            </Button>
        </div>
        <a className="pf-c-page__header-brand-link" href="./">
            <Logo />
        </a>
    </div>
);

Brand.propTypes = {
    navHidden: PropTypes.bool,
    toggleNav: PropTypes.func
};

function mapDispatchToProps(dispatch) {
    return {
        toggleNav: () => {
            dispatch(onToggle());
        }
    };
}

export default connect(({ chrome: { navHidden } }) => ({ navHidden }), mapDispatchToProps)(Brand);
