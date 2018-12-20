import * as actionTypes from './action-types';
import options from '../nav/globalNav';

export const onToggle = () => ({
    type: actionTypes.NAVIGATION_TOGGLE
});

export const userLogIn = (user) => ({
    type: actionTypes.USER_LOGIN,
    payload: user
});

export const clickAction = (data) => ({ type: actionTypes.CLICK_ACTION, payload: data });

export function identifyApp (data) {
    if (!options.some(item => item.id === data || (item.subItems && item.subItems.some(sub => sub.id === data)))) {
        throw new Error(`unknown app identifier: ${data}`);
    }

    const firstLevel = options.find(item => item.id === data || (item.subItems && item.subItems.some(sub => sub.id === data)));

    return { type: actionTypes.GLOBAL_NAV_IDENT, data: firstLevel.id };
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
