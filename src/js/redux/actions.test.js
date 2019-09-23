import { appAction, appObjectId } from './actions';

describe('appAction', () => {
    it('should return correct action with data', () => {
        expect(appAction('test-action')).toEqual({
            type: '@@chrome/app-page-action',
            payload: 'test-action'
        });
    });

    it('should return correct action without data', () => {
        expect(appAction()).toEqual({
            type: '@@chrome/app-page-action',
            payload: undefined
        });
    });
});

describe('appObjectId', () => {
    it('should return correct action with data', () => {
        expect(appObjectId('test-id')).toEqual({
            type: '@@chrome/app-object-id',
            payload: 'test-id'
        });
    });

    it('should return correct action without data', () => {
        expect(appObjectId()).toEqual({
            type: '@@chrome/app-object-id',
            payload: undefined
        });
    });
});
