import React, { ReactNode, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Dropdown, DropdownGroup, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';

import ChromeLink from '../ChromeLink/ChromeLink';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';

export type SettingsToggleDropdownGroup = {
  title?: string;
  isHidden?: boolean;
} & ({ items: SettingsToggleDropdownItem[]; customContent?: never } | { customContent: ReactNode; items?: never });

export type SettingsToggleDropdownItem = {
  url?: string;
  title: ReactNode;
  description?: React.ReactNode;
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

  const visibleGroups = props.dropdownItems.filter((group) => !group.isHidden);
  const dropdownItems = visibleGroups.map(({ title, items, customContent }, groupIndex) => (
    <DropdownGroup key={`${groupIndex}-${title}`} label={title}>
      {customContent
        ? customContent
        : items?.map(({ url, title, description, onClick, isHidden, isDisabled, rel = 'noopener noreferrer', ...rest }, itemIndex) =>
            !isHidden ? (
              <DropdownItem
                onClick={onClick}
                key={typeof title === 'string' ? title : itemIndex}
                ouiaId={rest.ouiaId ?? (typeof title === 'string' ? title : itemIndex)}
                isDisabled={isDisabled}
                component={
                  onClick || !url
                    ? undefined
                    : ({ className: itemClassName, children }) => (
                        <ChromeLink {...rest} className={itemClassName} href={url} rel={rel} isBeta={isPreview}>
                          {children}
                        </ChromeLink>
                      )
                }
                description={description}
              >
                {title}
              </DropdownItem>
            ) : (
              <React.Fragment key={`fragment-${itemIndex}`} />
            )
          )}
      {groupIndex < visibleGroups.length - 1 && <Divider key="divider" />}
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
          variant="default"
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
