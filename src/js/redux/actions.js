import * as actionTypes from './action-types';
import * as globalNav from '../nav/globalNav';

export const clickAction = (data) => ({ type: actionTypes.CLICK_ACTION, payload: data });

export function identifyApp (data) {
    if (!globalNav.options.some(item => item.id === data)) {
        throw new Error(`unknown app identifier: ${data}`);
    }

    return { type: actionTypes.GLOBAL_NAV_IDENT, data };
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
    return { type: actionTypes.APP_NAV_CLICK, payload: { id: item.id, event } };
}
