const analytics = require('./analytics');
const user      = require('./jwt/insights/user');
const token     = require('../../testdata/token.json');
const externalToken = require('../../testdata/externalToken.json');
const ibmToken = require('../../testdata/ibmToken.json');

describe('User + Analytics', () => {
    const getPendoConf = analytics.__get__('getPendoConf');
    const buildUser    = user.__get__('buildUser');
    describe('buildUser + getPendoConf internal', () => {
        test('should build a valid internal Pendo config', () => {
            const conf = getPendoConf(buildUser(token));
            expect(conf).toMatchObject({
                account: {
                    id: '540155'
                },
                visitor: {
                    id: '5299389_redhat',
                    internal: true,
                    lang: 'en_US'
                }
            });
        });

        test('should build a valid external Pendo config', () => {
            const conf = getPendoConf(buildUser(externalToken));
            expect(conf).toMatchObject({
                account: {
                    id: '540155'
                },
                visitor: {
                    id: '5299389',
                    internal: false,
                    lang: 'en_US'
                }
            });
        });

        test('should build a valid IBM pendo config', () => {
            const conf = getPendoConf(buildUser(ibmToken));
            expect(conf).toMatchObject({
                account: {
                    id: '540155'
                },
                visitor: {
                    id: '5299389_ibm',
                    internal: false,
                    lang: 'en_US'
                }
            });
        });
    });
});
