// const pub = {};

module.exports = (fileName) => {
    return (msg) => {
        if (window.console) {
            window.console.log(`[JWT][${fileName}] ${msg}`);
        }
    };
};
