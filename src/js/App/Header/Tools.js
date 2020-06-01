import React, { useState, useEffect } from 'react';

import { Button } from '@patternfly/react-core4/dist/js/components/Button/Button';
import { DropdownItem } from '@patternfly/react-core4/dist/js/components/Dropdown/DropdownItem';
import { PageHeaderTools } from '@patternfly/react-core4/dist/js/components/Page/PageHeaderTools';
import { PageHeaderToolsGroup } from '@patternfly/react-core4/dist/js/components/Page/PageHeaderToolsGroup';
import { PageHeaderToolsItem } from '@patternfly/react-core4/dist/js/components/Page/PageHeaderToolsItem';

import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';

import UserToggle from './UserToggle';
import UserIcon from './UserIcon';
import ToolbarToggle from './ToolbarToggle';
import InsightsAbout from './InsightsAbout';

const Tools = () => {

    const [isSettingsDisabled, setIsSettingsDisabled] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        window.insights.chrome.auth.getUser().then((user)=> user.identity.account_number && setIsSettingsDisabled(false));
    }, []);

    const SettingsButton = () => (
        <Button variant="plain"
            aria-label="Go to settings"
            widget-type='SettingsButton'
            className='ins-c-toolbar__button-settings'
            isDisabled={ isSettingsDisabled }
            onClick={() => window.location.href = `${document.baseURI}settings/rbac/`}>
            <CogIcon/>
        </Button>
    );

    const aboutMenuDropdownItems = [
        {
            title: 'Customer support',
            url: 'https://access.redhat.com/support'
        }, {
            title: 'Training',
            url: 'https://www.redhat.com/en/services/training-and-certification'
        }, {
            title: 'API documentation',
            onClick: () => window.location.href = `${document.baseURI}docs/api`
        }, {
            title: 'About',
            onClick: () => setIsModalOpen(true)
        }
    ];

    const mobileDropdownItems = [...aboutMenuDropdownItems, {
        title: 'Settings',
        onClick: () => window.location.href = `${document.baseURI}settings/rbac/`
    }];

    const AboutButton = () => (
        <ToolbarToggle
            key='Help menu'
            icon={ QuestionCircleIcon }
            id='HelpMenu'
            className='ins-c-toolbar__menu-help'
            widget-type='HelpMenu'
            dropdownItems={ aboutMenuDropdownItems }
        />
    );

    return (
        <PageHeaderTools widget-type="InsightsToolbar">

            {/* Show tools on medium and above screens */}
            <PageHeaderToolsGroup breakpointMods={[{ modifier: 'hidden' }, { modifier: 'visible', breakpoint: 'sm' }]}>
                <PageHeaderToolsItem>
                    { <SettingsButton/> }
                </PageHeaderToolsItem>
                <PageHeaderToolsItem>
                    { <AboutButton/> }
                </PageHeaderToolsItem>
            </PageHeaderToolsGroup>

            {/* Show full user dropdown on medium and above screens */}
            <PageHeaderToolsGroup breakpointMods={[{ modifier: 'hidden' }, { modifier: 'visible', breakpoint: 'sm' }]}>
                <PageHeaderToolsItem>
                    <UserToggle className='ins-c-dropdown__user'/>
                </PageHeaderToolsItem>
            </PageHeaderToolsGroup>

            {/* Collapse tools and user dropdown to kebab on small screens  */}
            <PageHeaderToolsGroup breakpointMods={[{ modifier: 'hidden', breakpoint: 'sm' }]}>
                <PageHeaderToolsItem>
                    <UserToggle isSmall extraItems={mobileDropdownItems.map((action, key) => (
                        <DropdownItem key={key} component="button" onClick={action.onClick}>{action.title}</DropdownItem>
                    ))} />
                </PageHeaderToolsItem>
            </PageHeaderToolsGroup>

            {/* User icon always visible */}
            <UserIcon/>

            {/* Render About Modal */}
            { isModalOpen && <InsightsAbout isModalOpen={isModalOpen} onClose={() => setIsModalOpen(!isModalOpen)} /> }
        </PageHeaderTools>
    );
};

export default Tools;
