import React, { Component } from 'react';
import { Button } from '@patternfly/react-core4/dist/js/components/Button/Button';
import { DropdownItem } from '@patternfly/react-core4/dist/js/components/Dropdown/DropdownItem';
import QuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';

import UserToggle from './UserToggle';
import UserIcon from './UserIcon';
import ToolbarToggle from './ToolbarToggle';
import InsightsAbout from './InsightsAbout';

import PropTypes from 'prop-types';
import { PageHeaderTools } from '@patternfly/react-core4/dist/js/components/Page/PageHeaderTools';
import { PageHeaderToolsGroup } from '@patternfly/react-core4/dist/js/components/Page/PageHeaderToolsGroup';
import { PageHeaderToolsItem } from '@patternfly/react-core4/dist/js/components/Page/PageHeaderToolsItem';

const aboutButton = {
    title: 'FAQ',
    icon: QuestionCircleIcon,
    id: 'HelpMenu',
    className: 'ins-c-toolbar__menu-help',
    widget: 'HelpMenu',
    items: [
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
            title: 'About'
        }
    ]
};

const actions = [
    aboutButton
];

const userToggleExtras = [
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
        onClick: () => this.onModalToggle
    }, {
        title: 'Settings',
        onClick: () => window.location.href = `${document.baseURI}settings/rbac/`
    }
];

const SettingsButton = ({ isDisabled }) => (
    <Button variant="plain"
        aria-label="Go to settings"
        widget-type='SettingsButton'
        className='ins-c-toolbar__button-settings'
        isDisabled={ isDisabled }
        onClick={() => window.location.href = `${document.baseURI}settings/rbac/`}>
        <CogIcon/>
    </Button>
);

SettingsButton.propTypes = {
    isDisabled: PropTypes.bool
};

class Tools extends Component {
    constructor(props) {
        super(props);
        this.onModalToggle = this.onModalToggle.bind(this);
        aboutButton.items[3].onClick = this.onModalToggle.bind(this);
        this.state = {
            isModalOpen: false,
            isSettingsDisabled: true
        };
    }

    componentDidMount() {
        window.insights.chrome.auth.getUser().then((user)=> user.identity.account_number && this.handleSettingsCog());
    }

    handleSettingsCog() {
        this.setState({
            isSettingsDisabled: false
        });
    }

    onModalToggle() {
        this.setState({
            isModalOpen: !this.state.isModalOpen
        });
    }

    render() {
        const { isModalOpen, isSettingsDisabled } = this.state;
        return (
            <PageHeaderTools widget-type="InsightsToolbar">
                {/* This group is for larger than mobile screens */}
                <PageHeaderToolsGroup breakpointMods={[{ modifier: 'hidden' }, { modifier: 'visible', breakpoint: 'sm' }]}>
                    <PageHeaderToolsItem>
                        { <SettingsButton isDisabled={ isSettingsDisabled }/> }
                    </PageHeaderToolsItem>
                    <PageHeaderToolsItem>
                        { actions.map((oneItem, key) => (
                            oneItem.items
                                ? <ToolbarToggle
                                    key={key}
                                    icon={oneItem.icon}
                                    id={oneItem.id}
                                    className={oneItem.className}
                                    widget-type={oneItem.widget}
                                    dropdownItems={oneItem.items} />
                                : <Button
                                    data-key={key}
                                    key={key}
                                    id={oneItem.id}
                                    className={oneItem.className}
                                    variant="plain"
                                    aria-label={`Overflow ${oneItem.title}`}
                                    widget-type={oneItem.widget}
                                    onClick={event => oneItem.onClick && oneItem.onClick(event)}>
                                        <oneItem.icon />
                                    </Button>
                        ))}
                    </PageHeaderToolsItem>
                </PageHeaderToolsGroup>
                <PageHeaderToolsGroup>
                    {/* Show Kebab for user menu on mobile + extras */}
                    <PageHeaderToolsItem breakpointMods={[{ modifier: 'hidden', breakpoint: 'md' }]}>
                        <UserToggle isSmall extraItems={userToggleExtras.map((action, key) => (
                            <DropdownItem key={key} component="button">{action.title}</DropdownItem>
                        ))} />
                    </PageHeaderToolsItem>

                    {/* Show regular user dropdown above mobile */}
                    <PageHeaderToolsItem breakpointMods={[{ modifier: 'hidden' }, { modifier: 'visible', breakpoint: 'md' }]}>
                        <UserToggle className='ins-c-dropdown__user'/>
                    </PageHeaderToolsItem>
                </PageHeaderToolsGroup>
                <UserIcon/>
                { isModalOpen && <InsightsAbout isModalOpen={isModalOpen} onClose={this.onModalToggle} /> }
            </PageHeaderTools>
        );
    }
}

export default Tools;
