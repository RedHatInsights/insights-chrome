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
    li.setAttribute('id', item.id);
    if (item.active) {
        li.classList.add('active');
    }

    const i = document.createElement('i');
    i.classList.add('fas');
    i.classList.add(item.icon);

    const span = document.createElement('span');
    span.textContent = item.title;

    li.appendChild(i);
    li.appendChild(span);

    return li;
}

export function render (state) {
    const ul = document.getElementById('navigation');
    ul.innerHTML = '';
    state.map(toNavElement).forEach(item => ul.appendChild(item));
}
