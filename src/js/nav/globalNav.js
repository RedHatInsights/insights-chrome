const basepath = '/insights/platform/';

export const options = Object.freeze([{
    id: 'dashboard',
    title: 'Dashboard'
}, {
    id: 'advisor',
    title: 'Advisor'
}, {
    id: 'vulnerability',
    title: 'Vulnerability'
}, {
    id: 'compliance',
    title: 'Compliance'
}, {
    id: 'cmaas',
    title: 'Cost Management'
}, {
    id: 'inventory',
    title: 'Inventory'
}, {
    id: 'reports',
    title: 'Reports'
}, {
    id: 'settings',
    title: 'Settings'
}]);

function toNavElement(item) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const span = document.createElement('span');

    li.classList.add('pf-c-nav__item');
    li.setAttribute('id', item.id);
    if (item.active) {
        li.classList.add('active');
        a.classList.add('pf-m-current');
        a.setAttribute('aria-current', 'page');
    }

    a.classList.add('pf-c-nav__link');
    a.setAttribute('href', basepath + item.id);
    a.setAttribute('widget-type', 'InsightsNavItem');
    a.setAttribute('widget-id', item.id);

    span.classList.add('pf-c-nav__link-text');
    span.textContent = item.title;

    a.appendChild(span);

    li.appendChild(a);

    return li;
}

export function render (state = options) {
    const ul = document.getElementById('navigation');
    ul.innerHTML = '';
    state.map(toNavElement).forEach(item => ul.appendChild(item));
}

// temporary fallback for apps that do not use the chrome API yet
document.addEventListener('DOMContentLoaded', () => !window.insights.chrome.on && render());
