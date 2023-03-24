import React, { useRef, useState } from 'react';
import { MenuToggle, Popper } from '@patternfly/react-core';
import useAppFilter from '../AppFilter/useAppFilter';

import './AllServicesDropdown.scss';
import AllServicesPortal from './AllServicesMenu';

export type ServicesNewNavProps = {
  Footer?: React.ReactNode;
};

const AllServicesDropdown = () => {
  const { isLoaded } = useAppFilter();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMenuKeys = (event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }
    if (menuRef.current?.contains(event.target as Node) || toggleRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsOpen((prev) => !prev);
        toggleRef.current?.focus();
      }
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (isOpen && !menuRef.current?.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, menuRef]);

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setIsOpen(!isOpen);
  };

  const toggle = (
    <MenuToggle className="pf-m-full-height chr-c-link-service-toggle" ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
      Services
    </MenuToggle>
  );

  return (
    <Popper
      trigger={toggle}
      appendTo={document.body}
      isVisible={isOpen}
      popper={<AllServicesPortal menuRef={menuRef} setIsOpen={setIsOpen} isOpen={isOpen} isLoaded={isLoaded} />}
    />
  );
};

export default AllServicesDropdown;
