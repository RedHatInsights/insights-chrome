import React, { Component } from 'react';
import { Nav, NavExpandable, NavList } from '@patternfly/react-core/dist/esm/components/Nav';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { appNavClick, clearActive } from '../../redux/actions';
import NavigationItem from './NavigationItem';

const basepath = document.baseURI;

class Navigation extends Component {
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

    onClick(_event, item, parent) {
        const { onNavigate, onClearActive, activeGroup, activeLocation, settings, appId } = this.props;
        if (parent && parent.active) {
            const activeLevel = settings.find(navItem => navItem.id === appId);
            if (activeLevel) {
                const activeItem = activeLevel.subItems.find(navItem => navItem.id === activeGroup);
                if (activeItem && activeItem.reload && !item.reload) {
                    window.location.href = `${basepath}${activeLocation}/${appId}/${item.id}`;
                }
            }

            if (!item.reload) {
                onNavigate && onNavigate(item);
            } else {
                window.location.href = `${basepath}${activeLocation}/${item.reload}`;
            }
        } else {
            if (item.group && activeGroup === item.group) {
                onClearActive && onClearActive();
                onNavigate && onNavigate(item);
            } else {
                const prefix = (parent && parent.id) ? `/${parent.id}/` : '/';
                window.location.href = `${basepath}${activeLocation}${prefix}${item.reload || item.id}`;
            }
        }
    }

    render() {
        const { settings, activeApp, navHidden, activeLocation } = this.props;

        if (navHidden) {
            document.querySelector('aside').setAttribute('hidden', true);
        }

        return (
            <Nav onSelect={this.onSelect} aria-label="Insights Global Navigation" >
                <NavList>
                    {
                        settings.map((item, key) => {
                            if (!item.disabled) {
                                if (item.subItems) {
                                    return <NavExpandable
                                        title={item.title}
                                        itemID={item.id}
                                        key={key}
                                        isActive={item.active}
                                        isExpanded={item.active}>
                                        {
                                            item.subItems.map((subItem, subKey) => (
                                                <NavigationItem
                                                    itemID={subItem.reload || subItem.id}
                                                    key={subKey}
                                                    title={subItem.title}
                                                    parent={`${activeLocation}${item.id ? `/${item.id}` : ''}`}
                                                    isActive={item.active && subItem.id === activeApp}
                                                    onClick={event => this.onClick(event, subItem, item)}
                                                />
                                            ))
                                        }
                                    </NavExpandable>;
                                } else {
                                    return <NavigationItem
                                        itemID={item.id}
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
    activeLocation: PropTypes.string
};

function stateToProps({ chrome: { globalNav, activeApp, navHidden, activeLocation, activeGroup, appId } }) {
    return ({ settings: globalNav, activeApp, navHidden, activeLocation, activeGroup, appId });
}

function dispatchToProps(dispatch) {
    return {
        onNavigate: (item) => dispatch(appNavClick(item)),
        onClearActive: () => dispatch(clearActive())
    };
}

export default connect(stateToProps, dispatchToProps)(Navigation);
