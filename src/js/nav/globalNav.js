export const options = Object.freeze([{
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'fa-tachometer-alt'
}, {
    id: 'advisor',
    title: 'Advisor',
    icon: 'fa-clipboard-list'
}, {
    id: 'security',
    title: 'Security',
    icon: 'fa-lock'
}, {
    id: 'compliance',
    title: 'Compliance',
    icon: 'fa-gavel'
}, {
    id: 'cmaas',
    title: 'Cost Management',
    icon: 'fa-piggy-bank'
}, {
    id: 'inventory',
    title: 'Inventory',
    icon: 'fa-database'
}, {
    id: 'reports',
    title: 'Reports',
    icon: 'fa-chart-bar'
}, {
    id: 'settings',
    title: 'Settings',
    icon: 'fa-cog'
}]);

function toNavElement(item) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const i = document.createElement('i');
    const span = document.createElement('span');

    li.classList.add('pf-c-vertical-nav__item');
    li.setAttribute('id', item.id);
    if (item.active) {
        li.classList.add('active');
        a.classList.add('pf-m-active');
        a.setAttribute('aria-current', 'page');
    }

    a.classList.add('pf-c-vertical-nav__link');

    i.classList.add('fas');
    i.classList.add(item.icon);

    span.classList.add('pf-c-vertical-nav__link-text');
    span.textContent = item.title;

    a.appendChild(i);
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
