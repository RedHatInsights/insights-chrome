/*global module*/

module.exports = (input) => {
    return {
        servicesGet: () => {
            return {
                then: (data) => {
                    return data({
                        foo: 'bar'
                    });
                }
            };
        }
    };
};
