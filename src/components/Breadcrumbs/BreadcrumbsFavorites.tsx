import React, { useEffect, useState } from 'react';
import { Icon, Menu, MenuItem, MenuList, MenuToggle, Popper } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import CaretDownIcon from '@patternfly/react-icons/dist/js/icons/caret-down-icon';
import classNames from 'classnames';

import './BreadcrumbsFavorites.scss';
import ChromeLink from '../ChromeLink/ChromeLink';

const BreadcrumbsFavorites = ({
  isFavorited,
  favoritePage,
  unfavoritePage,
}: {
  isFavorited: boolean;
  favoritePage: () => void;
  unfavoritePage: () => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (isOpen && !menuRef.current?.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const handleMenuKeys = (event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }
    if (menuRef.current?.contains(event.target as Node) || toggleRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape') {
        setIsOpen(!isOpen);
        toggleRef.current?.focus();
      }
    }
  };

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, menuRef]);
  const toggle = (
    <MenuToggle
      aria-label="Toggle"
      ref={toggleRef}
      variant="plain"
      onClick={onToggleClick}
      isExpanded={isOpen}
      className="pf-u-pt-xs pf-u-text-nowrap"
    >
      <Icon
        className={classNames('chr-c-breadcrumbs__favorite', {
          isFavorited,
        })}
        isInline
      >
        <StarIcon />
      </Icon>
      <CaretDownIcon className="pf-u-ml-sm" />
    </MenuToggle>
  );

  const menu = (
    <Menu ref={menuRef}>
      <MenuList key="favorites">
        <MenuItem
          onClick={() => {
            favoritePage();
            setIsOpen(false);
          }}
          isDisabled={isFavorited}
        >
          Add to Favorites
        </MenuItem>
        <MenuItem
          onClick={() => {
            unfavoritePage();
            setIsOpen(false);
          }}
          isDisabled={!isFavorited}
        >
          Remove from Favorites
        </MenuItem>
        <MenuItem component={(props) => <ChromeLink {...props} href="/favoritedservices" />}>View all Favorites</MenuItem>
      </MenuList>
    </Menu>
  );
  return (
    <div ref={containerRef}>
      <Popper
        placement="bottom-end"
        trigger={toggle}
        popper={menu}
        isVisible={isOpen}
        popperMatchesTriggerWidth={false}
        appendTo={containerRef.current || undefined}
      />
    </div>
  );
};

export default BreadcrumbsFavorites;
