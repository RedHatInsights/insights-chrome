// Type checking only. The standalone script relies on globals supplied by Catchpoint.
declare const page: import('@playwright/test').Page;
declare const expect: typeof import('@playwright/test').expect;
declare const Catchpoint: {
  setTracepoint: (token: string, value: string) => Promise<void>;
  startStep: (name: string) => Promise<void>;
  username: () => Promise<string>;
  password: () => Promise<string>;
};
