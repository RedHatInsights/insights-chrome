// const pub = {};

export default (fileName) => {
  return (msg) => {
    if (window.console) {
      if (window.localStorage && window.localStorage.getItem('chrome:jwt:debug')) {
        window.console.log(`[JWT][${fileName}] ${msg}`);
      }
    }
  };
};
