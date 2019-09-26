let priv = {};

module.exports.priv = priv;

const base        = jest.fn();
const servicesGet = jest.fn();

base.mockReturnValue({ servicesGet });
servicesGet.mockReturnValue({
    then: fn => {
        return fn({ foo: 'bar' });
    }
});

module.exports = base;
