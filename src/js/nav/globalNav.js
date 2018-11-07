import { appNavClick } from '../redux/actions';

const basepath = `${document.baseURI}/`;
export const options = Object.freeze([{
    id: 'dashboard',
    title: 'Dashboard'
}, {
    id: 'advisor',
    title: 'Advisor',
    subItems: [
        {
            id: 'actions',
            title: 'Actions'
        },
        {
            id: 'rules',
            title: 'Rules'
        }
    ]
}, {
    id: 'vulnerability',
    title: 'Vulnerability',
    subItems: [
        {
            id: '',
            title: 'Overview'
        },
        {
            id: 'cves',
            title: 'CVEs'
        },
        {
            id: 'systems',
            title: 'Systems'
        }
    ]
}, {
    id: 'compliance',
    title: 'Compliance'
}, {
    id: 'remediations',
    title: 'Remediations'
}, {
    id: 'cost-management',
    title: 'Cost Management',
    subItems: [
        {
            id: '',
            title: 'Overview'
        },
        {
            id: 'aws',
            title: 'Cloud Cost'
        },
        {
            id: 'ocp',
            title: 'OpenShift Charge'
        }
    ]
}, {
    id: 'inventory',
    title: 'Inventory'
}, {
    id: 'reports',
    title: 'Reports'
}, {
    id: 'sources',
    title: 'Sources'
}, {
    id: 'service-portal',
    title: 'Service Portal'
}, {
    id: 'subscriptions',
    title: 'Subscriptions'
}, {
    id: 'settings',
    title: 'Settings'
}]);

const expandIcon = `<span class="pf-c-nav__toggle" tabindex="-1" aria-disabled="true">
    <i class="fas fa-angle-right"></i>
</span>`;

function htmlToElement(html) {
    const template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function navItem(item, parentId = '') {
    const navigateTo = `${basepath}${parentId}/${item.id}`;
    item.active = item.active || (item.id !== '' && location.pathname.indexOf(navigateTo) !== -1);
    return `<li class="pf-c-nav__item">
        <a navigate="${navigateTo}"
            app-id="${item.id}"
            href="${navigateTo}"
            class="pf-c-nav__link ${item.active ? 'pf-m-current' : ''}"
            aria-current="page"
        >
            ${item.title}
        </a>
    </li>`;
}

function secondaryNav(parent, { active, id: parentId, subItems }, { dispatch }) {
    parent.setAttribute('aria-expanded', !!active);
    parent.appendChild(htmlToElement(expandIcon));
    const secondaryNav = htmlToElement(`<section
        class="pf-c-nav__subnav"
        aria-labelledby="${parentId}" ${active ? '' : 'hidden' }
    >
        <ul class="pf-c-nav__simple-list">${subItems.map(oneItem => navItem(oneItem, parentId)).join('')}</ul>
    </section>`
    );
    secondaryNav.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        if (active) {
            dispatch(appNavClick({ id: event.target.getAttribute('app-id') }, event));
        } else {
            window.location.href = event.target.getAttribute('navigate');
        }
    };

    if (active && !subItems.find(oneChild => oneChild.active)) {
        dispatch(appNavClick(subItems[0], { target: secondaryNav.querySelector('a.pf-c-nav__link') }));
    }

    return secondaryNav;
}

function toNavElement(item, store) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const span = document.createElement('span');

    li.classList.add('pf-c-nav__item');
    li.setAttribute('id', item.id);
    if (item.active) {
        li.classList.add('current');
        a.classList.add('pf-m-current');
        a.setAttribute('aria-current', 'page');
    }

    a.classList.add('pf-c-nav__link');
    a.setAttribute('navigate', basepath + item.id);
    a.setAttribute('href', basepath + item.id);
    a.setAttribute('widget-type', 'InsightsNavItem');
    a.setAttribute('widget-id', item.id);

    span.classList.add('pf-c-nav__link-text');
    span.textContent = item.title;

    a.appendChild(span);
    let subMenu;
    if (item.subItems && item.subItems.length > 0) {
        subMenu = secondaryNav(a, item, store);
        li.classList.add('pf-m-expandable');
        !!item.active && li.classList.add('pf-m-expanded');
    }

    a.onclick = (event) => primaryClickHandler(event, a);
    li.appendChild(a);
    subMenu && li.appendChild(subMenu);

    return li;
}

function primaryClickHandler(event, navElement) {
    event.stopPropagation();
    const parentElement = navElement.parentElement;
    if (!parentElement.classList.contains('pf-m-expandable')) {
        window.location.href = parentElement.getAttribute('navigate');
    } else {
        event.preventDefault();
        if (parentElement.classList.contains('pf-m-expanded')) {
            parentElement.querySelector('section').setAttribute('hidden', true);
            parentElement.classList.remove('pf-m-expanded');
        } else {
            parentElement.querySelector('section').removeAttribute('hidden');
            parentElement.classList.add('pf-m-expanded');
        }
    }
}

export function render (state = options, store) {
    const ul = document.getElementById('navigation');
    ul.innerHTML = '';
    state.map(item => toNavElement(item, store)).forEach(item => ul.appendChild(item));
}

// temporary fallback for apps that do not use the chrome API yet
document.addEventListener('DOMContentLoaded', () => !window.insights.chrome.on && render());
