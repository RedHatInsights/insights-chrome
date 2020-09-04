import isGlobalFilterEnabled, { EXCLUDED_PAGES } from './isGlobalFilterEnabled';

describe('isGlobalFilterEnabled', () => {
    let loc;
    beforeEach(() => {
        loc = location.pathanme;
    });

    afterEach(() => {
        location.pathname = loc;
    });
    it('should return false if pathname does not include insights partial', () => {
        location.pathname = 'foo';
        expect(isGlobalFilterEnabled()).toEqual(false);
    });

    it('should return false if pathname includes excluded page', () => {
        expect.assertions(EXCLUDED_PAGES.length);
        EXCLUDED_PAGES.forEach(page => {
            location.pathname = page;
            expect(isGlobalFilterEnabled()).toEqual(false);
        });
    });

    it('should return false if chrome is not beta', () => {
        const isBetaSpy = jest.spyOn(window.insights.chrome, 'isBeta').mockReturnValueOnce(false);
        location.pathname = 'insights/foo';
        expect(isGlobalFilterEnabled()).toEqual(false);
        isBetaSpy.mockRestore();
    });

    it('should return true if chrome is beta', () => {
        const isBetaSpy = jest.spyOn(window.insights.chrome, 'isBeta').mockReturnValueOnce(true);
        location.pathname = 'insights/foo';
        expect(isGlobalFilterEnabled()).toEqual(true);
        isBetaSpy.mockRestore();
    });

    it('should return true if chrome is not beta but chrome:experimental:global-filter is true', () => {
        const isBetaSpy = jest.spyOn(window.insights.chrome, 'isBeta').mockReturnValueOnce(false);
        const getItemSpy = jest.spyOn(window.localStorage, 'getItem').mockReturnValueOnce(true);
        location.pathname = 'insights/foo';
        expect(isGlobalFilterEnabled()).toEqual(true);
        isBetaSpy.mockRestore();
        getItemSpy.mockRestore();
    });
});
