import React, { Component } from 'react';
import { Button } from '@patternfly/react-core/dist/esm/components/Button';
import { Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core/dist/esm/layouts/Toolbar';
import { DropdownItem } from '@patternfly/react-core/dist/esm/components/Dropdown';
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
// import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
// import BellIcon from '@patternfly/react-icons/dist/esm/icons/bell-icon';
// import CogIcon from '@patternfly/react-icons/dist/esm/icons/cog-icon';
import UserToggle from './UserToggle';
import ToolbarToggle from './ToolbarToggle';
import InsightsAbout from './InsightsAbout';

const aboutButton = {
    title: 'FAQ',
    icon: QuestionCircleIcon,
    widget: 'InsightsFAQ'
};

const actions = [
    // {
    //     title: 'Search',
    //     icon: SearchIcon,
    //     widget: 'InsightsSearch'
    // },
    // {
    //     title: 'Notification',
    //     icon: BellIcon,
    //     widget: 'InsightsNotifications'
    // },
    // {
    //     title: 'Settings',
    //     icon: CogIcon,
    //     widget: 'InsightsSettings',
    //     items: [
    //         {
    //             title: 'Topological Inventory',
    //             url: 'topological-inventory'
    //         }
    //     ]
    // },
    aboutButton
];

class Tools extends Component {
    constructor(props) {
        super(props);
        this.onModalToggle = this.onModalToggle.bind(this);
        aboutButton.onClick = this.onModalToggle.bind(this);
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
                        <ToolbarItem className="pf-u-sr-only pf-u-visible-on-lg">
                            <UserToggle />
                        </ToolbarItem>
                    </ToolbarGroup>
                    { isModalOpen && <InsightsAbout isModalOpen={isModalOpen} onClose={this.onModalToggle} /> }
                </Toolbar>
            </div>
        );
    }
}

export default Tools;
