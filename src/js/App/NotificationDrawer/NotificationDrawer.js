/* eslint-disable  */
import React, { useState, Fragment } from 'react';
import { Dropdown, DropdownItem, DropdownPosition, DropdownDirection,
    DropdownSeparator, KebabToggle, NotificationDrawer, NotificationDrawerBody, NotificationDrawerHeader, NotificationDrawerList,
    NotificationDrawerListItem, NotificationDrawerListItemBody, NotificationDrawerListItemHeader,
    Popover, PopoverPosition, Button } from '@patternfly/react-core';
import { MessagesIcon } from '@patternfly/react-icons'

const dropdownItems = [
    <DropdownItem key="link">Link</DropdownItem>,
    <DropdownItem key="action" component="button">
        Action
      </DropdownItem>,
    <DropdownSeparator key="separator" />,
    <DropdownItem key="disabled link" isDisabled>
        Disabled Link
      </DropdownItem>
];


const BasicNotificationDrawer = (props) => {

    const [open, setOpen] = useState(false);
    const [active, setActive] = useState('');

    const onToggle = isOpen => setOpen(isOpen);
    const onFocus = id => {
        if (id) {
            const element = document.getElementById(id);
            element.focus();
        }
    }
    const onSelect = event => {
        setOpen(!open);
        setActive('');
        onFocus(event.target.id);

    }
    const onClick = event => {
        setActive(event.target.id);
        onFocus(event.target.id);
    }

   
    return (
        <Popover
            headerContent={<div>Notifications</div>}
            bodyContent={
                <NotificationDrawer>
                    <NotificationDrawerHeader count={2}>
                        <Dropdown
                            onClick={onClick}
                            onSelect={onSelect}
                            toggle={<KebabToggle onToggle={onToggle} id="toggle-id-basic" />}
                            isOpen={open && active === 'toggle-id-basic'}
                            isPlain
                            dropdownItems={dropdownItems}
                            id="notification-0"
                            position={DropdownPosition.right}
                        />
                    </NotificationDrawerHeader>
                    <NotificationDrawerBody>
                        <NotificationDrawerList>
                            <NotificationDrawerListItem variant="info">
                                <NotificationDrawerListItemHeader variant="info" title="Unread info notification title" srTitle="Info notification:">
                                    <Dropdown
                                        position={DropdownPosition.right}
                                        onClick={onClick}
                                        onSelect={onSelect}
                                        toggle={<KebabToggle onToggle={onToggle} id="toggle-id-1" />}
                                        isOpen={open && active === 'toggle-id-1'}
                                        isPlain
                                        dropdownItems={dropdownItems}
                                        id="notification-1"
                                    />
                                </NotificationDrawerListItemHeader>
                                <NotificationDrawerListItemBody timestamp="5 minutes ago">
                                    This is an info notification description.
                            </NotificationDrawerListItemBody>
                            </NotificationDrawerListItem>
                        </NotificationDrawerList>
                    </NotificationDrawerBody>
                </NotificationDrawer>
            }
            position="bottom"
            minWidth="1000px"
        >
            <Button variant="plain">
                <MessagesIcon/>
            </Button>
        </Popover>

    );
}

export default BasicNotificationDrawer;
