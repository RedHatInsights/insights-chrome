const pub = {};

pub.exposeTest = (priv) => {
    if (window.NODE_ENV === 'test') {
        module.exports.priv = priv;
    }
};

module.exports = pub;
