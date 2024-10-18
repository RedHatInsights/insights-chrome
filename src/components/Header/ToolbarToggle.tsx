import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';

import ChromeLink from '../ChromeLink/ChromeLink';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';

export type ToolbarToggleDropdownItem = {
  url?: string;
  appId?: string;
  target?: string;
  title: string;
  onClick?: (event: MouseEvent | React.MouseEvent<any, MouseEvent> | React.KeyboardEvent<Element>) => void;
  isHidden?: boolean;
  isDisabled?: boolean;
  rel?: string;
};

export type ToolbarToggleProps = {
  icon?: React.ElementType;
  dropdownItems: ToolbarToggleDropdownItem[];
  widgetType?: string | number;
  className?: string;
  id?: string | number;
  hasToggleIndicator?: null;
  ouiaId?: string;
  isHidden?: boolean;
  ariaLabel?: string;
};

const ToolbarToggle = (props: ToolbarToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isPreview = useAtomValue(isPreviewAtom);

  const onSelect = () => {
    setIsOpen((prev) => !prev);
  };

  const onToggle = () => setIsOpen((prev) => !prev);

  const onClickInternal = (
    ev: MouseEvent | React.KeyboardEvent<Element> | React.MouseEvent<any, MouseEvent>,
    url?: string,
    onClick?: ToolbarToggleDropdownItem['onClick']
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
  const dropdownItems = props.dropdownItems.map(
    ({ url, appId, title, onClick, isHidden, isDisabled, target = '_blank', rel = 'noopener noreferrer', ...rest }) =>
      !isHidden ? (
        <DropdownItem
          key={title}
          ouiaId={title}
          isDisabled={isDisabled}
          component={
            appId && url
              ? ({ className: itemClassName }) => (
                  <ChromeLink {...rest} className={itemClassName} href={url} target={target} rel={rel} isBeta={isPreview} appId={appId}>
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
  );

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
          icon={props.icon && <props.icon />}
        />
      )}
      isOpen={isOpen}
      onSelect={onSelect}
      ouiaId={props.ouiaId}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default ToolbarToggle;
