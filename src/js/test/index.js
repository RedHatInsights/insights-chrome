/**
 * Common test utilities
 */

// create navigation placeholder in JSDOM
beforeAll(() => {

    window.testEnv = true;

    if (document.getElementById('navigation')) {
        return;
    }

    const body = document.getElementsByTagName('body')[0];
    const ul = document.createElement('ul');
    ul.setAttribute('id', 'navigation');
    body.appendChild(ul);
});
