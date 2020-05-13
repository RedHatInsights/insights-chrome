/* eslint-disable  */
import React from 'react';
import { Dropdown, DropdownItem, DropdownPosition, DropdownDirection,
    DropdownSeparator, KebabToggle, NotificationDrawer, NotificationDrawerBody, NotificationDrawerHeader, NotificationDrawerList,
    NotificationDrawerListItem, NotificationDrawerListItemBody, NotificationDrawerListItemHeader,
    Popover, PopoverPosition, Button } from '@patternfly/react-core';

class BasicNotificationDrawer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            isActive: ''
        };
        this.onToggle = isOpen => {
            this.setState({
                isOpen
            });
        };

        this.onSelect = event => {
            this.setState({
                isOpen: !this.state.isOpen,
                isActive: ''
            });
            this.onFocus(event.target.id);
        };

        this.onClick = event => {
            this.setState({
                isActive: event.target.id
            });
            this.onFocus(event.target.id);
        };

        this.onFocus = (id) => {
            if (id) {
                const element = document.getElementById(id);
                element.focus();
            }
        };
    }
    
    render() {
        const { isOpen, isActive } = this.state;
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
        return (
            <Popover
                headerContent={<div>Popover Header</div>}
                bodyContent={
                    <NotificationDrawer>
                        <NotificationDrawerHeader count={2}>
                            <Dropdown
                                onClick={this.onClick}
                                onSelect={this.onSelect}
                                toggle={<KebabToggle onToggle={this.onToggle} id="toggle-id-basic" />}
                                isOpen={isOpen && isActive === 'toggle-id-basic'}
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
                                            onClick={this.onClick}
                                            onSelect={this.onSelect}
                                            toggle={<KebabToggle onToggle={this.onToggle} id="toggle-id-1" />}
                                            isOpen={isOpen && isActive === 'toggle-id-1'}
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
                footerContent="Popover Footer"
                position="bottom"
            >
                <Button>Notifications</Button>
            </Popover>
            
        );
    }
}
export default BasicNotificationDrawer;
