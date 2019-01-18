import React from 'react';
import { connect } from 'react-redux';
import { onToggle } from '../../redux/actions';
import { Button } from '@patternfly/react-core/dist/esm/components/Button';
import BarsIcon from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import Logo from './Logo';

const Brand = ({ toggleNav }) => (<div className="pf-l-page__header-brand">
    <div>
        <Button
            variant="plain"
            aria-label="Toggle primary navigation"
            widget-type="InsightsNavToggle"
            onClick={() => toggleNav && window.navToggle()}
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
        toggleNav: () => {
            dispatch(onToggle());
            window.navToggle(); // eslint-disable-line no-undef
        }
    };
}

export default connect(null, mapDispatchToProps)(Brand);
