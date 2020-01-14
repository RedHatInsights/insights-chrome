import React, { Component } from 'react';
import { Button } from '@patternfly/react-core';
import { Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { DropdownItem } from '@patternfly/react-core';
import { QuestionCircleIcon, CogIcon } from '@patternfly/react-icons';

import UserToggle from './UserToggle';
import UserIcon from './UserIcon';
import ToolbarToggle from './ToolbarToggle';
import InsightsAbout from './InsightsAbout';

const aboutButton = {
    title: 'FAQ',
    icon: QuestionCircleIcon,
    widget: 'InsightsFAQ',
    items: [
        {
            title: 'Help & assistance',
            url: 'https://access.redhat.com/help/'
        }, {
            title: 'Customer support',
            url: 'https://access.redhat.com/support'
        }, {
            title: 'Training',
            url: 'https://www.redhat.com/en/services/training-and-certification'
        }, {
            title: 'API Documentation',
            onClick: () => window.location.href = `${document.baseURI}docs/api`
        }, {
            title: 'About'
        }
    ]
};

const actions = [
    aboutButton
];

const settingsButton = (
    <ToolbarItem>
        <Button variant="plain"
            aria-label="Go to settings"
            widget-type='SettingsButton'
            onClick={() => window.location.href = `${document.baseURI}settings/`}>
            <CogIcon/>
        </Button>
    </ToolbarItem>
);

class Tools extends Component {
    constructor(props) {
        super(props);
        this.onModalToggle = this.onModalToggle.bind(this);
        aboutButton.items[4].onClick = this.onModalToggle.bind(this);
        this.state = {
            isModalOpen: false
        };
    }
    onModalToggle() {
        this.setState({
            isModalOpen: !this.state.isModalOpen
        });
    }

    render() {
        const { isModalOpen } = this.state;
        return (
            <div className="pf-l-page__header-tools pf-c-page__header-tools" widget-type="InsightsToolbar">
                <Toolbar>
                    <ToolbarGroup className='pf-u-mr-0 pf-u-mr-lg-on-lg'>
                        { settingsButton }
                        { actions.map((oneItem, key) => (
                            oneItem.items ?
                                <ToolbarToggle key={key} icon={oneItem.icon} dropdownItems={oneItem.items} /> :
                                <ToolbarItem key={key} data-key={key}>
                                    <Button
                                        key={key}
                                        variant="plain"
                                        aria-label={`Overflow ${oneItem.title}`}
                                        widget-type={oneItem.widget}
                                        onClick={event => oneItem.onClick && oneItem.onClick(event)}
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
