import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Dropdown, DropdownGroup, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
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

  const dropdownItems = props.dropdownItems.map(({ title, items }, groupIndex) => (
    <DropdownGroup key={`${groupIndex}-${title}`} label={title}>
      {items.map(({ url, title, description, onClick, isHidden, isDisabled, rel = 'noopener noreferrer', ...rest }, itemIndex) =>
        !isHidden ? (
          <DropdownItem
            onClick={onClick}
            key={title}
            ouiaId={rest.ouiaId ?? title}
            isDisabled={isDisabled}
            component={
              onClick
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
        <Button
          ref={toggleRef}
          variant={props.icon && 'control'}
          className={props.className}
          id={props.id?.toString()}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={props.ariaLabel}
          aria-expanded={isOpen}
          isClicked={isOpen}
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
