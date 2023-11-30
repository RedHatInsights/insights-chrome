// const pub = {};

export default (fileName: string) => {
  return (msg: string | unknown) => {
    if (window.console) {
      if (window.localStorage && window.localStorage.getItem('chrome:auth:debug')) {
        window.console.log(`[AUTH][${fileName}] ${msg}`);
      }
    }
  };
};
