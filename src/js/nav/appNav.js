import * as actions from '../redux/actions';
import get from 'lodash/get';

export function render (state, store) {
    // remove all app navigation uls
    Array.from(document.getElementsByClassName('navigation-secondary'))
    .forEach(element => element.parentNode.removeChild(element));

    const parent = getParent(store);

    const ul = document.createElement('ul');
    ul.classList.add('navigation-secondary');

    state.map(optionMapper.bind(store)).forEach(li => ul.appendChild(li));

    parent.appendChild(ul);
}

function getParent (store) {
    const parentId = get(store.getState(), 'chrome.appId');
    if (!parentId) {
        throw new Error('App not identified. Did you call insights.chrome.appIdent() ?');
    }

    return document.getElementById(parentId);
}

function optionMapper (item) {
    const li = document.createElement('li');
    li.onclick = event => {
        event.stopPropagation();
        this.dispatch(actions.appNavClick(item, event));
    };

    li.textContent = item.title;
    if (item.active) {
        li.classList.add('active');
    }

    return li;
}
