import React from 'react';
import { MastheadToggle } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { PageToggleButton } from '@patternfly/react-core/dist/dynamic/components/Page';
import BarsIcon from '@patternfly/react-icons/dist/dynamic/icons/bars-icon';

const MastheadMenuToggle = ({
  isNavOpen,
  setIsNavOpen,
  className,
}: {
  isNavOpen?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) => {
  return (
    <MastheadToggle>
      <PageToggleButton
        className={className}
        variant="plain"
        aria-label="Global navigation"
        isSidebarOpen={isNavOpen}
        onSidebarToggle={() => {
          setIsNavOpen?.((prev) => !prev);
        }}
      >
        <BarsIcon />
      </PageToggleButton>
    </MastheadToggle>
  );
};

export default MastheadMenuToggle;
