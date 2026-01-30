import React, { PropsWithChildren, useEffect } from 'react';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { unstable_HistoryRouter as BrowserRouter } from 'react-router-dom';
import useQuickstartLinkStore, { createQuickstartLinkMarkupExtension } from './useQuickstarLinksStore';
import chromeHistory from '../utils/chromeHistory';

const DEFAULT_LINK = '/test-link';
const DEFAULT_URL = 'https://test.com/test-link';
const TEST_UUID: ReturnType<typeof crypto.randomUUID> = 'test-uuid' as any; // Mock UUID for testing

type TestSpy = {
  current: {
    addLinkSpy?: jest.SpyInstance;
  };
};

function HistoryTrigger({
  link = DEFAULT_LINK,
  linkTestId = 'test-link',
  children,
  testSpy = { current: {} },
}: PropsWithChildren<{
  link?: string;
  testSpy?: TestSpy;
  linkTestId?: string;
}>) {
  const store = useQuickstartLinkStore();
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    // map spy functions to access them from test cases
    const addLinkSpy = jest.spyOn(store, 'addLinkElement');
    testSpy.current.addLinkSpy = addLinkSpy;
    if (linkRef.current) {
      store.addLinkElement(linkTestId);
    }
  }, []);
  return (
    <BrowserRouter history={chromeHistory as any}>
      <div>
        <div>History Trigger</div>
        <button
          onClick={() => {
            // mutate the history
            window.history.replaceState({ quickstartLink: true }, '', link);
            // Dispatch a custom event to simulate the history change
            const e = new Event('replacestate');
            // Add state to the event to simulate a quickstart link click
            // can't do in constructor
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            e.state = { quickstartLink: true };
            window.dispatchEvent(e);
          }}
        >
          Trigger History Push
        </button>
      </div>
      {children}
      <a ref={linkRef} href={link} id="test-link">
        Test Link
      </a>
    </BrowserRouter>
  );
}

describe('useQuickstarLinksStore', () => {
  describe('link store', () => {
    it('should init the interface', () => {
      const { result } = renderHook(() => useQuickstartLinkStore());
      expect(result.current).toBeDefined();
      expect(result.current.addLinkElement).toBeDefined();
      expect(result.current.emptyElements).toBeDefined();
    });

    it('should register quickstarts link click listener', () => {
      const historyPushSpy = jest.spyOn(chromeHistory, 'push');

      waitFor(() => {
        render(<HistoryTrigger></HistoryTrigger>);
      });

      const triggerButton = screen.getByRole('button');
      triggerButton.click();

      expect(historyPushSpy).toHaveBeenCalledWith(DEFAULT_LINK);
      expect(historyPushSpy).toHaveBeenCalledTimes(1);
    });

    it('should  push chrome history state on quickstart link click', () => {
      jest.useFakeTimers();
      const replaceStateSpy = jest.spyOn(window.history, 'replaceState');
      const testSpy: TestSpy = { current: {} };
      waitFor(() => {
        render(<HistoryTrigger testSpy={testSpy}></HistoryTrigger>);
      });

      // The link addLinkElement is wrapped in timeout to push to the end of execution loop to ensure the link is rendered
      // we need to postpone the rest of the tests to ensure the link is added to the store
      jest.runAllTimers();
      const triggerLink = screen.getByText('Test Link');
      triggerLink.click();

      expect(replaceStateSpy).toHaveBeenCalledWith({ quickstartLink: true }, '', DEFAULT_URL);
      expect(testSpy.current.addLinkSpy).toHaveBeenCalledWith('test-link');
      expect(testSpy.current.addLinkSpy).toHaveBeenCalledTimes(1);
    });

    it('should not add link element if it is not found', () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
      const testSpy: TestSpy = { current: {} };
      waitFor(() => {
        render(<HistoryTrigger linkTestId="foo" testSpy={testSpy}></HistoryTrigger>);
      });

      // The link addLinkElement is wrapped in timeout to push to the end of execution loop to ensure the link is rendered
      // we need to postpone the rest of the tests to ensure the link is added to the store
      jest.runAllTimers();
      const triggerLink = screen.getByText('Test Link');
      triggerLink.click();

      expect(testSpy.current.addLinkSpy).toHaveBeenCalledWith('foo');
      expect(testSpy.current.addLinkSpy).toHaveBeenCalledTimes(1);
      // Ensure that the interval is cleared after 5 iterations
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('createQuickstartLinkMarkupExtension', () => {
    jest.spyOn(window.crypto, 'randomUUID').mockReturnValue(TEST_UUID);
    const mockLinkStore = {
      addLinkElement: jest.fn(),
      emptyElements: jest.fn(),
    };

    beforeEach(() => {
      mockLinkStore.addLinkElement.mockClear();
      mockLinkStore.emptyElements.mockClear();
    });

    it('should match MD link with no origin and call addLinkElement', () => {
      const markdownText = '[Test Link](/test-link)';
      const mdExtension = createQuickstartLinkMarkupExtension(mockLinkStore);
      const result = mdExtension.replace(markdownText);
      expect(mockLinkStore.addLinkElement).toHaveBeenCalledWith(TEST_UUID);
      expect(mockLinkStore.addLinkElement).toHaveBeenCalledTimes(1);
      expect(result).toBe(`<a id="${TEST_UUID}" href="/test-link">Test Link</a>`);
    });

    it('should match MD link with same origin and call addLinkElement', () => {
      const markdownText = `[Test Link](${window.location.origin}/test-link)`;
      const mdExtension = createQuickstartLinkMarkupExtension(mockLinkStore);
      const result = mdExtension.replace(markdownText);
      expect(mockLinkStore.addLinkElement).toHaveBeenCalledWith(TEST_UUID);
      expect(mockLinkStore.addLinkElement).toHaveBeenCalledTimes(1);
      expect(result).toBe(`<a id="${TEST_UUID}" href="${window.location.origin}/test-link">Test Link</a>`);
    });

    it('should not match MD link with different origin', () => {
      const markdownText = '[Test Link](https://example.com/test-link)';
      const mdExtension = createQuickstartLinkMarkupExtension(mockLinkStore);
      const result = mdExtension.replace(markdownText);
      expect(mockLinkStore.addLinkElement).not.toHaveBeenCalled();
      expect(result).toBe(markdownText); // No change should be made
    });

    it('should fall back on error and output original MD', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      // Example markdown with no links
      const markdownText = `
    # Heading Example

    - List item one
    - List item two

    **Bold text** and _italic text_.

    > Blockquote example.
    `;
      const mdExtension = createQuickstartLinkMarkupExtension(mockLinkStore);
      const result = mdExtension.replace(markdownText);
      expect(mockLinkStore.addLinkElement).not.toHaveBeenCalled();
      expect(result).toBe(markdownText); // No change should be made
      expect(console.error).toHaveBeenCalledWith('Error creating quickstart link markup', expect.any(Error));
    });
  });
});
