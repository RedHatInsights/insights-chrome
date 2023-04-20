import React from 'react';
import { MastheadToggle, PageToggleButton } from '@patternfly/react-core';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';
import { useDispatch } from 'react-redux';
import { onToggle } from '../../redux/actions';

const MastheadMenuToggle = ({
  isNavOpen,
  setIsNavOpen,
  className,
  iconSize = 'sm',
}: {
  isNavOpen?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}) => {
  const dispatch = useDispatch();
  return (
    <MastheadToggle>
      <PageToggleButton
        className={className}
        variant="plain"
        aria-label="Global navigation"
        isNavOpen={isNavOpen}
        onNavToggle={() => {
          setIsNavOpen?.((prev) => !prev);
          dispatch(onToggle());
        }}
      >
        <BarsIcon size={iconSize} />
      </PageToggleButton>
    </MastheadToggle>
  );
};

export default MastheadMenuToggle;
