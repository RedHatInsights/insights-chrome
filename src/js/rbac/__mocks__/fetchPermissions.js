export const createFetchPermissionsWatcher = () => {
    return async (_t, promiseSpy) => {
        return promiseSpy('mocked-user-permissions');
    };
};
