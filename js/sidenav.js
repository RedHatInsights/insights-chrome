const menu = {
    'dashboard': {
        url: '/insights/dashboard/map'
    },
    'advisor': {
        url: '/insights/advisor'
    },
    'security': {
        url: '/insights/security'
    },
    'compliance': {
        url: '/insights/compliance'
    },
    'cmaas': {
        url: '/insights/cmaas'
    },
    'vmaas': {
        url: '/insights/vmaas'
    },
    'inventory': {
        url: '/insights/deployments'
    },
    'reports': {
        url: '/insights/reports'
    },
    'settings': {
        url: '/insights/settings'
    }
};

let selectedMenu = 'dashboard';

const selectOption = (menuItem) => {
    const prevMenu = selectedMenu;
    selectedMenu = menuItem;

    // remove active class from prevMenu and set to selectedMenu
    document.getElementById(prevMenu).classList.remove('active');
    document.getElementById(selectedMenu).classList.add('active');

    window.location.href = menu[menuItem].url;
};