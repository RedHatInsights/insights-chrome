/*global module*/
const Keycloak = jest.genMockFromModule('keycloak-js');

function init(options) {
    console.log('Called mock init');
    return {};
}

function constructor(options) {
    console.log('Called mock constructor');
    return {};
}

Keycloak.init = init;
Keycloak.constructor = constructor;

module.exports = Keycloak;
