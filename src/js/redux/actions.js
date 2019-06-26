import * as actionTypes from './action-types';

export const onToggle = () => ({
    type: actionTypes.NAVIGATION_TOGGLE
});

export const userLogIn = (user) => ({
    type: actionTypes.USER_LOGIN,
    payload: user
});

export const clickAction = (data) => ({ type: actionTypes.CLICK_ACTION, payload: data });

function isCurrApp(item, app) {
    if (item.id === app) {
        return true;
    } else if (item.subItems && item.subItems.some(sub => sub.id === app)) {
        return true;
    } else if (item.group === app) {
        return true;
    }

    return false;
}

export function identifyApp (data, options) {
    if (data === 'landing') {
        return { type: actionTypes.GLOBAL_NAV_IDENT, data: { id: data } };
    }

    if (!options.some(item => isCurrApp(item, data))) {
        throw new Error(`unknown app identifier: ${data}`);
    }

    const firstLevel = options.find((item) => isCurrApp(item, data));

    return { type: actionTypes.GLOBAL_NAV_IDENT, data: { id: firstLevel.id || firstLevel.title, activeApp: data } };
}

export function appNav (data) {
    if (!Array.isArray(data)) {
        throw new Error(`invalid parameter type: ${typeof data}`);
    }

    data.forEach(item => {
        if (typeof item.id !== 'string') {
            throw new Error(`missing id field`);
        }

        if (typeof item.title !== 'string') {
            throw new Error(`missing title field`);
        }
    });

    return { type: actionTypes.APP_NAV, data };
}

export function appNavClick(item, event) {
    return { type: actionTypes.APP_NAV_CLICK, payload: { id: item && item.id, event } };
}

export function clearActive() {
    return {
        type: actionTypes.CLEAR_ACTIVE
    };
}

export function chromeNavUpdate(newNav) {
    console.log('in the action');
    return { type: actionTypes.CHROME_NAV_UPDATE, payload: { newNav } };
}
