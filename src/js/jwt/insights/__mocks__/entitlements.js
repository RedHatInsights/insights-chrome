/*global module*/

module.exports = () => {
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
