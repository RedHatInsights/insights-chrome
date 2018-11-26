import React from 'react';
import { Toolbar, ToolbarGroup, ToolbarItem, Button } from '@patternfly/react-core';
import { SearchIcon, BellIcon, CogIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import UserToggle from './UserToggle';

const actions = [
    <Button variant="plain" aria-label="Overflow search" widget-type="InsightsSearch"><SearchIcon /></Button>,
    <Button variant="plain" aria-label="Overflow notifications" widget-type="InsightsNotifications"><BellIcon /></Button>,
    <Button variant="plain" aria-label="Overflow settings" widget-type="InsightsSettings"><CogIcon /></Button>,
    <Button variant="plain" aria-label="Overflow faq" widget-type="InsightsFAQ"><QuestionCircleIcon /></Button>
];

export default () => (
    <div className="pf-l-page__header-tools" widget="InsightsToolbar">
        <Toolbar>
            <ToolbarGroup className="pf-u-sr-only pf-u-visible-on-lg">
                {actions.map((oneItem, key) => (
                    <ToolbarItem key={key} data-key={key}>{oneItem}</ToolbarItem>
                ))}
            </ToolbarGroup>
            <ToolbarGroup>
                <ToolbarItem className="pf-u-hidden-on-lg pf-u-mr-0">
                    <UserToggle isSmall extraItems={actions} />
                </ToolbarItem>
                <ToolbarItem className="pf-u-sr-only pf-u-visible-on-lg">
                    <UserToggle />
                </ToolbarItem>
            </ToolbarGroup>
        </Toolbar>
    </div>
);
