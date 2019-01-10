import React from 'react';
import { Button } from '@patternfly/react-core/dist/esm/components/Button';
import { Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core/dist/esm/layouts/Toolbar';
import { DropdownItem } from '@patternfly/react-core/dist/esm/components/Dropdown';
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import BellIcon from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import CogIcon from '@patternfly/react-icons/dist/esm/icons/cog-icon';
import UserToggle from './UserToggle';
import ToolbarToggle from './ToolbarToggle';

const actions = [
    {
        title: 'Search',
        icon: SearchIcon,
        widget: 'InsightsSearch'
    },
    {
        title: 'Notification',
        icon: BellIcon,
        widget: 'InsightsNotifications'
    },
    {
        title: 'Settings',
        icon: CogIcon,
        widget: 'InsightsSettings',
        items: [
            {
                title: 'Sources',
                url: 'sources'
            }
        ]
    },
    {
        title: 'FAQ',
        icon: QuestionCircleIcon,
        widget: 'InsightsFAQ'
    }
];

export default () => (
    <div className="pf-l-page__header-tools" widget-type="InsightsToolbar">
        <Toolbar>
            <ToolbarGroup className="pf-u-sr-only pf-u-visible-on-lg">
                {actions.map((oneItem, key) => (
                    oneItem.items ?
                        <ToolbarToggle icon={oneItem.icon} dropdownItems={oneItem.items} /> :
                        <ToolbarItem key={key} data-key={key}>
                            <Button
                                variant="plain"
                                aria-label={`Overflow ${oneItem.title}`}
                                widget-type={oneItem.widget}
                            >
                                <oneItem.icon />
                            </Button>
                        </ToolbarItem>
                ))}
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarItem className="pf-u-hidden-on-lg pf-u-mr-0">
                    <UserToggle isSmall extraItems={actions.map((action, key) => (
                        <DropdownItem key={key} component="button" isDisabled>{action.title}</DropdownItem>
                    ))} />
                </ToolbarItem>
                <ToolbarItem className="pf-u-sr-only pf-u-visible-on-lg">
                    <UserToggle />
                </ToolbarItem>
            </ToolbarGroup>
        </Toolbar>
    </div>
);
