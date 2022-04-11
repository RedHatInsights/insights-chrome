// const pub = {};

export default (fileName: string) => {
  return (msg: string | unknown) => {
    if (window.console) {
      if (window.localStorage && window.localStorage.getItem('chrome:jwt:debug')) {
        window.console.log(`[JWT][${fileName}] ${msg}`);
      }
    }
  };
};
