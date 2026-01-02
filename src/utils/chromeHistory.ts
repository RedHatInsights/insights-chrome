import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

// listen on quickstart link click
export function registerQuickstartLinkClickListener() {
  function listener(event: Event) {
    const { state } = event as unknown as { state?: { quickstartLink?: boolean } };
    const isQuickstartLink = state?.quickstartLink;
    if (isQuickstartLink) {
      history.push(window.location.pathname);
    }
  }

  window.addEventListener('replacestate', listener);
  return () => {
    window.removeEventListener('replacestate', listener);
  };
}

export default history;
