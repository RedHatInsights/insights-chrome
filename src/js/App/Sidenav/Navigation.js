import React, { Component } from 'react';
import { Nav } from '@patternfly/react-core/dist/js/components/Nav/Nav';
import  { NavItem } from '@patternfly/react-core/dist/js/components/Nav/NavItem';
import { NavExpandable } from '@patternfly/react-core/dist/js/components/Nav/NavExpandable';
import { NavList } from '@patternfly/react-core/dist/js/components/Nav/NavList';
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

// TODO: refactor this funcion
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
        const { onNavigate, onClearActive, activeGroup, activeLocation, settings, appId } = this.props;

        const isMetaKey = (event.ctrlKey || event.metaKey || event.which === 2);
        let url = `${basepath}${activeLocation || ''}`;

        // always redirect if in subNav and current or new navigation has reload
        if (parent?.active) {
            const activeLevel = settings.find(({ id }) => id === appId);
            const activeItem = activeLevel?.subItems?.find?.(({ id }) => id === activeGroup);
            if (item.reload || activeItem?.reload) {
                url = `${url}/${item.reload || `${appId}/${item.id}`}`;
                isMetaKey ? window.open(url) : window.location.href = url;
            }
        }

        // If in SPA do not perform redirect
        if ((item.group && activeGroup === item.group) || parent?.active) {
            if (isMetaKey) {
                window.open(`${url}/${item.id}`);
            } else {
                !parent?.active && onClearActive();
                onNavigate(item, event);
            }
        } else {
            const itemUrl = `${parent?.id ? `/${parent.id}` : ''}/${item.id}`;
            url = `${url}${item.reload || itemUrl}`;
            console.log(url, itemUrl);
            isMetaKey ? window.open(url) : window.location.href = url;
        }
    }

    render() {
        const { settings, activeApp, activeLocation, documentation } = this.props;
        return (
            <Nav onSelect={this.onSelect} aria-label="Insights Global Navigation" data-ouia-safe="true">
                <NavList>
                    {
                        settings?.map((item, key) => {
                            if (!(item.disabled_on_stable && window.location.pathname.indexOf('/beta') === -1)) {
                                if (item.subItems) {
                                    return <NavExpandable
                                        className="ins-m-navigation-align"
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
                                                        ignoreCase={subItem.ignoreCase}
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
                                        ignoreCase={item.ignoreCase}
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
            ignoreCase: PropTypes.bool,
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
