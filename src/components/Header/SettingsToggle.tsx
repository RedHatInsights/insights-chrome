import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Dropdown, DropdownGroup, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';

import ChromeLink from '../ChromeLink/ChromeLink';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';

export type SettingsToggleDropdownGroup = {
  title?: string;
  items: SettingsToggleDropdownItem[];
};

export type SettingsToggleDropdownItem = {
  url: string;
  title: string;
  onClick?: (event: MouseEvent | React.MouseEvent<any, MouseEvent> | React.KeyboardEvent<Element>) => void;
  isHidden?: boolean;
  isDisabled?: boolean;
  rel?: string;
  ouiaId?: string;
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
  const isPreview = useAtomValue(isPreviewAtom);

  const dropdownItems = props.dropdownItems.map(({ title, items }, groupIndex) => (
    <DropdownGroup key={title} label={title}>
      {items.map(({ url, title, onClick, isHidden, isDisabled, rel = 'noopener noreferrer', ...rest }) =>
        !isHidden ? (
          <DropdownItem
            onClick={onClick}
            key={title}
            ouiaId={rest.ouiaId ?? title}
            isDisabled={isDisabled}
            component={
              onClick
                ? undefined
                : ({ className: itemClassName }) => (
                    <ChromeLink {...rest} className={itemClassName} href={url} rel={rel} isBeta={isPreview}>
                      {title}
                    </ChromeLink>
                  )
            }
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
          icon={props.icon && <props.icon />}
        />
      )}
      isOpen={isOpen}
      onSelect={() => setIsOpen((prev) => !prev)}
      ouiaId={props.ouiaId}
      className="chr-c-menu-settings"
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default SettingsToggle;
