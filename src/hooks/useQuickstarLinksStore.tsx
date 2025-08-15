import React, { useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registerQuickstartLinkClickListener } from '../utils/chromeHistory';

function useQuickstartLinkStore() {
  const store = useMemo(() => new Map<string, HTMLAnchorElement>(), []);

  function addLinkElement(id: string) {
    let iterations = 0;
    setTimeout(() => {
      // push execution to end of the call stack
      const findInterval = setInterval(() => {
        const element = document.getElementById(id);
        if (element) {
          store.set(id, element as HTMLAnchorElement);
          element.addEventListener('click', (e) => {
            const { href } = element as HTMLAnchorElement;
            if (!href) {
              return;
            }
            e.preventDefault();
            window.history.replaceState(
              {
                quickstartLink: true,
              },
              '',
              href
            );
          });
          clearInterval(findInterval);
        }
        iterations += 1;
        if (iterations > 5) {
          clearInterval(findInterval);
        }
      }, 1000);
    });
  }

  function emptyElements() {
    store.clear();
  }
  useEffect(() => {
    const unregister = registerQuickstartLinkClickListener();
    return () => {
      unregister();
      emptyElements();
    };
  }, []);

  return {
    addLinkElement,
    emptyElements,
  };
}

export function createQuickstartLinkMarkupExtension(quickstartLinkStore: ReturnType<typeof useQuickstartLinkStore>) {
  return {
    type: 'lang',
    // matches MD links like [link text](https://example.com)
    regex: /\[.*\]\(.*\)/g,
    replace: (text: string) => {
      try {
        let [linkText, linkURL] = text.split('](');
        linkText = linkText.replace(/^\[/, '');
        linkURL = linkURL.replace(/\)$/, '');
        let href: string;
        try {
          const fullURL = new URL(linkURL);
          href = fullURL.toString();
          if (fullURL.origin !== window.location.origin) {
            // link is external, do not intercept
            return text;
          }
        } catch {
          // not full URL, is just a pathname
          href = linkURL;
        }
        const linkId = crypto.randomUUID();
        quickstartLinkStore.addLinkElement(linkId);
        const node = (
          <a id={linkId} href={href}>
            {linkText}
          </a>
        );
        return renderToStaticMarkup(node);
      } catch (e) {
        console.error('Error creating quickstart link markup', e);
        return text;
      }
    },
  };
}

export default useQuickstartLinkStore;
