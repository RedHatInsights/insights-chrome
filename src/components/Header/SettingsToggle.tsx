import React, { useState } from 'react';
import { Dropdown, DropdownGroup, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';

import ChromeLink from '../ChromeLink/ChromeLink';
import { isBeta } from '../../utils/common';

export type SettingsToggleDropdownGroup = {
  title: string;
  items: SettingsToggleDropdownItem[];
};

export type SettingsToggleDropdownItem = {
  url: string;
  title: string;
  onClick?: (event: MouseEvent | React.MouseEvent<any, MouseEvent> | React.KeyboardEvent<Element>) => void;
  isHidden?: boolean;
  isDisabled?: boolean;
  rel?: string;
};

export type SettingsToggleProps = {
  icon?: React.ElementType;
  dropdownItems: SettingsToggleDropdownGroup[];
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

  const dropdownItems = props.dropdownItems.map(({ title, items }, groupIndex) => (
    <DropdownGroup key={title} label={title}>
      {items.map(({ url, title, onClick, isHidden, isDisabled, rel = 'noopener noreferrer', ...rest }) =>
        !isHidden ? (
          <DropdownItem
            key={title}
            ouiaId={title}
            isDisabled={isDisabled}
            component={({ className: itemClassName }) => (
              <ChromeLink {...rest} className={itemClassName} href={url} rel={rel} isBeta={isBeta()}>
                {title}
              </ChromeLink>
            )}
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
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={props.ariaLabel}
          isExpanded={isOpen}
        >
          {props.icon && <props.icon />}
        </MenuToggle>
      )}
      isOpen={isOpen}
      onSelect={() => setIsOpen((prev) => !prev)}
      ouiaId={props.ouiaId}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default SettingsToggle;
