export const priv = {};

const base = jest.fn();
const servicesGet = jest.fn();

base.mockReturnValue({ servicesGet });
servicesGet.mockReturnValue({
  then: (fn: (...args: unknown[]) => unknown) => {
    return fn({ foo: 'bar' });
  },
});

export default base;
