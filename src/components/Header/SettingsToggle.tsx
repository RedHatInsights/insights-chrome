import React, { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList, DropdownGroup } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';

import ChromeLink from '../ChromeLink/ChromeLink';
import { isBeta } from '../../utils/common';

export type SettingsToggleDropdownGroups = SettingsToggleDropdownGroup[];

export type SettingsToggleDropdownGroup = {
  title: string;
  items: SettingsToggleDropdownItem[];
};

export type SettingsToggleDropdownItem = {
  url?: string;
  appId?: string;
  target?: string;
  title: string;
  onClick?: (event: MouseEvent | React.MouseEvent<any, MouseEvent> | React.KeyboardEvent<Element>) => void;
  isHidden?: boolean;
  isDisabled?: boolean;
  rel?: string;
};

export type SettingsToggleProps = {
  icon?: React.ElementType;
  dropdownItems: SettingsToggleDropdownGroups;
  widgetType?: string | number;
  className?: string;
  id?: string | number;
  hasToggleIndicator?: null;
  ouiaId?: string;
  isHidden?: boolean;
  ariaLabel?: string;
};

const SettingsToggle = (props: SettingsToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onSelect = () => {
    setIsOpen((prev) => !prev);
  };

  const onToggle = () => setIsOpen((prev) => !prev);

  const onClickInternal = (
    ev: MouseEvent | React.KeyboardEvent<Element> | React.MouseEvent<any, MouseEvent>,
    url?: string,
    onClick?: SettingsToggleDropdownItem['onClick']
  ) => {
    ev.preventDefault();
    if (url) {
      window.location.href = `${url}`;
    }

    if (onClick) {
      onClick(ev);
    }
  };

  // Render the question mark icon items
  const dropdownItems = props.dropdownItems.map(({ title, items }, groupIndex) => (
    <DropdownGroup key={title} label={title}>
      {items.map(({ url, appId, title, onClick, isHidden, isDisabled, target = '_blank', rel = 'noopener noreferrer', ...rest }) =>
        !isHidden ? (
          <DropdownItem
            key={title}
            ouiaId={title}
            isDisabled={isDisabled}
            component={
              appId && url
                ? ({ className: itemClassName }) => (
                    <ChromeLink {...rest} className={itemClassName} href={url} target={target} rel={rel} isBeta={isBeta()} appId={appId}>
                      {title}
                    </ChromeLink>
                  )
                : url
                ? 'a'
                : 'button'
            }
            // Because the urls are using 'a', don't use onClick for accessibility
            // If it is a button, use the onClick prop
            {...(appId
              ? {}
              : url
              ? {
                  href: url,
                  target,
                  rel,
                  ...rest,
                }
              : { onClick: (ev) => onClickInternal(ev, url, onClick) })}
          >
            {title}
          </DropdownItem>
        ) : (
          <React.Fragment key="fragment" />
        )
      )}
      {groupIndex < props.dropdownItems.length - 1 && <Divider key="divider" />}
    </DropdownGroup>
  ));

  return (
    <Dropdown
      popperProps={{
        position: PopoverPosition.right,
      }}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant={props.icon ? 'plain' : 'default'}
          className={props.className}
          id={props.id?.toString()}
          onClick={onToggle}
          aria-label={props.ariaLabel}
          isExpanded={isOpen}
        >
          {props.icon && <props.icon />}
        </MenuToggle>
      )}
      isOpen={isOpen}
      onSelect={onSelect}
      ouiaId={props.ouiaId}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default SettingsToggle;
