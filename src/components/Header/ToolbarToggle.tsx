import React, { useState } from 'react';
import { Dropdown, DropdownItem, DropdownPosition, DropdownProps, DropdownToggle } from '@patternfly/react-core';

import ChromeLink from '../ChromeLink/ChromeLink';
import { isBeta } from '../../utils/common';

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

  const onSelect = () => {
    setIsOpen((prev) => !prev);
  };

  const onToggle = (isOpen: boolean) => setIsOpen(isOpen);

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

  // Render the questionmark icon items
  const dropdownItems: DropdownProps['dropdownItems'] = props.dropdownItems.map(
    ({ url, appId, title, onClick, isHidden, isDisabled, target = '_blank', rel = 'noopener noreferrer', ...rest }) =>
      !isHidden ? (
        <DropdownItem
          key={title}
          ouiaId={title}
          disabled={isDisabled}
          component={
            appId && url ? (
              <ChromeLink href={url} target={target} rel={rel} isBeta={isBeta()} appId={appId}>
                {title}
              </ChromeLink>
            ) : url ? (
              'a'
            ) : (
              'button'
            )
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

  const toggle = (
    <DropdownToggle
      className={props.className}
      id={props.id?.toString()}
      ouiaId={props.id}
      toggleIndicator={props.hasToggleIndicator}
      onToggle={onToggle}
      aria-label={props.ariaLabel}
    >
      {props.icon && <props.icon />}
    </DropdownToggle>
  );

  return (
    <Dropdown
      position={DropdownPosition.right}
      toggle={toggle}
      isOpen={isOpen}
      dropdownItems={dropdownItems}
      onSelect={onSelect}
      ouiaId={props.ouiaId}
      isPlain
    />
  );
};

export default ToolbarToggle;
