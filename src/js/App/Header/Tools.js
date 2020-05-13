import React, { Component } from 'react';
import { Button } from '@patternfly/react-core';
import { Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { DropdownItem } from '@patternfly/react-core';
import { QuestionCircleIcon, CogIcon } from '@patternfly/react-icons';

import UserToggle from './UserToggle';
import UserIcon from './UserIcon';
import ToolbarToggle from './ToolbarToggle';
import InsightsAbout from './InsightsAbout';
import BasicNotificationDrawer from '../NotificationDrawer/NotificationDrawer';

import PropTypes from 'prop-types';

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

const userToggleExtras = [];

const SettingsButton = ({ isDisabled }) => (
    <ToolbarItem>
        <Button variant="plain"
            aria-label="Go to settings"
            widget-type='SettingsButton'
            className='ins-c-toolbar__button-settings'
            isDisabled={ isDisabled }
            onClick={() => window.location.href = `${document.baseURI}settings/rbac/`}>
            <CogIcon/>
        </Button>
    </ToolbarItem>
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
            <div className="pf-l-page__header-tools pf-c-page__header-tools" widget-type="InsightsToolbar">
                <Toolbar>
                    <ToolbarGroup className='pf-u-mr-0 pf-u-mr-lg-on-lg'>
                        { <SettingsButton isDisabled={ isSettingsDisabled }/> }
                        { actions.map((oneItem, key) => (
                            oneItem.items ?
                                <ToolbarToggle
                                    key={key}
                                    icon={oneItem.icon}
                                    id={oneItem.id}
                                    className={oneItem.className}
                                    widget-type={oneItem.widget}
                                    dropdownItems={oneItem.items} /> :
                                <ToolbarItem key={key} data-key={key}>
                                    <Button
                                        key={key}
                                        id={oneItem.id}
                                        className={oneItem.className}
                                        variant="plain"
                                        aria-label={`Overflow ${oneItem.title}`}
                                        widget-type={oneItem.widget}
                                        onClick={event => oneItem.onClick && oneItem.onClick(event)}
                                    >
                                        <oneItem.icon />
                                    </Button>
                                </ToolbarItem>
                        ))}
                        <ToolbarItem>
                            <BasicNotificationDrawer />
                        </ToolbarItem>
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <ToolbarItem className="pf-u-hidden-on-lg pf-u-mr-0">
                            <UserToggle isSmall extraItems={userToggleExtras.map((action, key) => (
                                <DropdownItem key={key} component="button" isDisabled>{action.title}</DropdownItem>
                            ))} />
                        </ToolbarItem>
                        <ToolbarItem className="pf-u-screen-reader pf-u-visible-on-lg">
                            <UserToggle className='ins-c-dropdown__user'/>
                        </ToolbarItem>
                    </ToolbarGroup>
                    { isModalOpen && <InsightsAbout isModalOpen={isModalOpen} onClose={this.onModalToggle} /> }
                </Toolbar>
                <UserIcon/>
            </div>
        );
    }
}

export default Tools;
