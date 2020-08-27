import accessRbac from '../js/rbac/rbac.js';
import MockAdapter from 'axios-mock-adapter';

export const mock = new MockAdapter(accessRbac('uSeRtOkEn'));
