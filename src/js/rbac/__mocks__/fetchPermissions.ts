export const createFetchPermissionsWatcher = () => {
  return async (_t: any, promiseSpy: jest.Mock) => {
    return promiseSpy('mocked-user-permissions');
  };
};
