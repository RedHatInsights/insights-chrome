let selectedMenu = 'dashboard';

const selectOption = (menuItem) => {
    const prevMenu = selectedMenu;
    selectedMenu = menuItem;

    // remove active class from prevMenu and set to selectedMenu
    document.getElementById(prevMenu).classList.remove('active');
    document.getElementById(selectedMenu).classList.add('active');
};