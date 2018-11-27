import React from 'react';
import { connect } from 'react-redux';
import { onToggle } from '../../redux/actions';
import { Button } from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import Logo from './Logo';

const Brand = ({ toggleNav }) => (<div className="pf-l-page__header-brand">
    <div>
        <Button
            variant="plain"
            aria-label="Toggle primary navigation"
            widget-type="InsightsNavToggle"
            onClick={() => toggleNav && toggleNav()}
        >
            <BarsIcon size="md"/>
        </Button>
    </div>
    <a className="pf-l-page__header-brand-link" href="./platform/dashboard/">
        <Logo />
    </a>
</div>);

function mapDispatchToProps(dispatch) {
    return {
        toggleNav: () => dispatch(onToggle())
    };
}

export default connect(null, mapDispatchToProps)(Brand);
