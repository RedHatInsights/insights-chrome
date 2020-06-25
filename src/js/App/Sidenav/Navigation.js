import React, { Component } from 'react';
import { Nav } from '@patternfly/react-core4/dist/js/components/Nav/Nav';
import  { NavItem } from '@patternfly/react-core4/dist/js/components/Nav/NavItem';
import { NavExpandable } from '@patternfly/react-core4/dist/js/components/Nav/NavExpandable';
import { NavList } from '@patternfly/react-core4/dist/js/components/Nav/NavList';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { appNavClick, clearActive } from '../../redux/actions';
import NavigationItem from './NavigationItem';

import './Navigation.scss';

const basepath = document.baseURI;

const openshiftLinks = {
    supportcases: {
        title: 'Support Cases',
        link: 'https://access.redhat.com/support/cases'
    },
    feedback: {
        title: 'Cluster Manager Feedback',
        link: 'mailto:ocm-feedback@redhat.com'
    },
    marketplace: {
        title: 'Red Hat Marketplace',
        link: 'https://marketplace.redhat.com'
    }
};

const insightsLinks = {
    subscriptionWatch: {
        title: 'Subscription Watch',
        link: './subscriptions/'
    }
};

export class Navigation extends Component {
    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onSelect({ groupId, itemID }) {
        this.setState({
            activeGroup: groupId,
            activeItem: itemID
        });
    };

    onClick(event, item, parent) {
        event.persist();
        const { onNavigate, onClearActive, activeGroup, activeLocation, settings, appId } = this.props;

        const isMetaKey = (event.ctrlKey || event.metaKey || event.which === 2);
        let url;

        if (parent && parent.active) {
            const activeLevel = settings.find(navItem => navItem.id === appId);
            if (activeLevel) {
                const activeItem = activeLevel.subItems.find(navItem => navItem.id === activeGroup);
                if (activeItem && activeItem.reload && !item.reload) {
                    url = `${basepath}${activeLocation}/${appId}/${item.id}`;
                    isMetaKey ? window.open(url) : window.location.href = url;
                }
            }

            if (!item.reload) {
                isMetaKey ?  window.open(`${basepath}${activeLocation}/${item.reload}`) :  onNavigate && onNavigate(item, event);
            } else {
                url = `${basepath}${activeLocation}/${item.reload}`;
                isMetaKey ? window.open(url) : window.location.href = url;
            }
        } else {
            if (item.group && activeGroup === item.group) {
                if (isMetaKey) {
                    window.open(`${basepath}${activeLocation}/${item.id}`);
                } else {
                    onClearActive && onClearActive();
                    onNavigate && onNavigate(item, event);
                }
            } else {
                const prefix = (parent && parent.id && !item.reload) ? `/${parent.id}/` : '/';
                url = `${basepath}${activeLocation}${prefix}${item.reload || item.id}`;
                isMetaKey ? window.open(url) : window.location.href = url;
            }
        }
    }

    render() {
        const { settings, activeApp, /*navHidden,*/ activeLocation, documentation } = this.props;
        // if (navHidden) {
        //     //document.querySelector('aside').setAttribute('hidden', true);
        // }

        return (
            <Nav onSelect={this.onSelect} aria-label="Insights Global Navigation" data-ouia-safe="true">
                <NavList>
                    {
                        settings.map((item, key) => {
                            if (!(item.disabled_on_stable && window.location.pathname.indexOf('/beta') === -1)) {
                                if (item.subItems) {
                                    return <NavExpandable
                                        title={item.title}
                                        ouia-nav-group={item.id}
                                        itemID={item.id}
                                        key={key}
                                        isActive={item.active}
                                        isExpanded={item.active}>
                                        {
                                            item.subItems.map((subItem, subKey) => {
                                                if (!(subItem.disabled_on_stable
                                                    && window.location.pathname.indexOf('/beta') === -1)) {
                                                    return <NavigationItem
                                                        itemID={subItem.reload || subItem.id}
                                                        ouia-nav-item={subItem.reload || subItem.id}
                                                        key={subKey}
                                                        title={subItem.title}
                                                        parent={`${activeLocation}${item.id ? `/${item.id}` : ''}`}
                                                        isActive={item.active && subItem.id === activeApp}
                                                        onClick={event => this.onClick(event, subItem, item)}
                                                    />;
                                                }
                                            })
                                        }
                                    </NavExpandable>;
                                } else {
                                    return <NavigationItem
                                        itemID={item.id}
                                        ouia-nav-item={item.id}
                                        key={key}
                                        title={item.title}
                                        parent={activeLocation}
                                        isActive={item.active || item.id === activeApp}
                                        onClick={event => this.onClick(event, item)}
                                    />;
                                }
                            }
                        })
                    }
                    { activeLocation === 'insights' &&
                        Object.entries(insightsLinks).map(
                            ([key, value]) => {
                                return <NavItem
                                    key={key}
                                    to={value.link}
                                    target='_blank'
                                    rel='noopener noreferrer'>
                                    {value.title}
                                </NavItem>;
                            }
                        )
                    }
                    { documentation &&
                        <React.Fragment>
                            <NavItem
                                className="ins-c-page__documentation"
                                to={documentation}
                                rel='noopener noreferrer'
                                target='_blank'>Documentation
                            </NavItem>
                        </React.Fragment>
                    }
                    { activeLocation === 'openshift' &&
                        Object.entries(openshiftLinks).map(
                            ([key, value]) => {
                                return <NavItem
                                    key={key}
                                    to={value.link}
                                    target='_blank'
                                    rel='noopener noreferrer'>
                                    {value.title}
                                </NavItem>;
                            }
                        )
                    }
                </NavList>
            </Nav>
        );
    }
}

Navigation.propTypes = {
    appId: PropTypes.string,
    settings: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            title: PropTypes.string,
            subItems: () => Navigation.propTypes.settings
        })
    ),
    activeApp: PropTypes.string,
    navHidden: PropTypes.bool,
    activeLocation: PropTypes.string,
    documentation: PropTypes.string,
    onNavigate: PropTypes.func,
    onClearActive: PropTypes.func,
    activeGroup: PropTypes.string
};

function stateToProps({ chrome: { globalNav, activeApp, navHidden, activeLocation, activeGroup, appId } }) {
    return ({ settings: globalNav, activeApp, navHidden, activeLocation, activeGroup, appId });
}

export function dispatchToProps(dispatch) {
    return {
        onNavigate: (item, event) => dispatch(appNavClick(item, event)),
        onClearActive: () => dispatch(clearActive())
    };
}

export default connect(stateToProps, dispatchToProps)(Navigation);
