import React from 'react';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { MastheadToggle } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { PageToggleButton } from '@patternfly/react-core/dist/dynamic/components/Page';
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
        isSidebarOpen={isNavOpen}
        onSidebarToggle={() => {
          setIsNavOpen?.((prev) => !prev);
          dispatch(onToggle());
        }}
      >
        <Icon size={iconSize}>
          <BarsIcon />
        </Icon>
      </PageToggleButton>
    </MastheadToggle>
  );
};

export default MastheadMenuToggle;
