import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onToggle } from '../../redux/actions';
import { Button } from '@patternfly/react-core/dist/js/components/Button/Button';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';
import Logo from './Logo';

const Brand = () => {
  const dispatch = useDispatch();
  const navHidden = useSelector(({ chrome: { navHidden } }) => navHidden);
  return (
    <div className="pf-c-page__header-brand">
      <div hidden={navHidden} className="pf-c-page__header-brand-toggle">
        <Button variant="plain" aria-label="Toggle primary navigation" widget-type="InsightsNavToggle" onClick={() => dispatch(onToggle())}>
          <BarsIcon size="md" />
        </Button>
      </div>
      <a className="pf-c-page__header-brand-link" href="./">
        <Logo />
      </a>
    </div>
  );
};

export default Brand;
