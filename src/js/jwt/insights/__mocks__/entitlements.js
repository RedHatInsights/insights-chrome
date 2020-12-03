export let priv = {};

const base = jest.fn();
const servicesGet = jest.fn();

base.mockReturnValue({ servicesGet });
servicesGet.mockReturnValue({
  then: (fn) => {
    return fn({ foo: 'bar' });
  },
});

export default base;
