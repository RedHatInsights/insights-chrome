const analytics = require('./analytics');
const user      = require('./jwt/insights/user');
const token     = require('../../testdata/token.json');

describe('User + Analytics', () => {
    const getPendoConf = analytics.__get__('getPendoConf');
    const buildUser    = user.__get__('buildUser');
    describe('buildUser + getPendoConf', () => {
        test('should build a valid Pendo config', () => {
            const conf = getPendoConf(buildUser(token).identity);
            expect(conf).toMatchObject({
                account: {
                    id: '540155'
                },
                visitor: {
                    id: 5299389,
                    internal: true,
                    lang: 'en_US'
                }
            });
        });
    });
});
