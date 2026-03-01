import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import RocketIconLight from '@patternfly/react-icons/dist/esm/icons/rocket-icon';
import { useRemoteHook } from '@scalprum/react-core';

import { getOpenShiftIntercomStore, useOpenShiftIntercomStore } from '../../state/stores/openShiftIntercomStore';
import './OpenShiftIntercom.scss';
import { useFlag } from '@unleash/proxy-client-react';

// Intercom positioning constants
const INTERCOM_CONFIG = {
  DEFAULT_PADDING: 20,
  MIN_PADDING: 20,
} as const;

/**
 * Calculates safe positioning for Intercom widget relative to a button element.
 * Ensures the widget doesn't overlap with the button or go outside screen bounds.
 */
const calculateSafeIntercomPadding = (buttonRect: DOMRect, windowDimensions: { width: number; height: number }) => {
  const paddingFromBottom = windowDimensions.height - buttonRect.bottom;
  const paddingFromRight = windowDimensions.width - buttonRect.right;

  return {
    vertical: Math.max(INTERCOM_CONFIG.MIN_PADDING, Math.min(windowDimensions.height, paddingFromBottom)),
    horizontal: Math.max(INTERCOM_CONFIG.MIN_PADDING, Math.min(windowDimensions.width, paddingFromRight)),
  };
};

export type OpenShiftIntercomModuleProps = {
  className?: string;
};

const OpenShiftIntercomModule: React.FC<OpenShiftIntercomModuleProps> = ({ className }) => {
  const { isExpanded } = useOpenShiftIntercomStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const displayModule = useFlag('platform.chrome.openshift-intercom');
  const isIntercomAvailable = typeof window !== 'undefined' && window.Intercom;

  const { hookResult } = useRemoteHook<[boolean, Dispatch<SetStateAction<boolean>>]>({
    scope: 'virtualAssistant',
    module: './state/globalState',
    importName: 'useIsOpen',
  });
  const [isVAOpen, setIsVAOpen] = hookResult || [false, () => {}];
  const messageUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Positions Intercom widget in the default bottom-right corner with standard padding.
   * Used when the chat is opened to ensure proper placement away from the button.
   */
  const updatePositionToDefault = useCallback(() => {
    if (window.Intercom) {
      window.Intercom('update', {
        vertical_padding: INTERCOM_CONFIG.DEFAULT_PADDING,
        horizontal_padding: INTERCOM_CONFIG.DEFAULT_PADDING,
        hide_default_launcher: true,
      });
    }
  }, []);

  /**
   * Dynamically positions Intercom widget relative to the button position.
   * Prevents notifications from appearing next to the button by calculating
   * appropriate padding based on button location and screen dimensions.
   */
  const updatePositionRelativeToButton = useCallback(() => {
    if (!displayModule || !window.Intercom || !buttonRef.current) {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const windowDimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const { vertical, horizontal } = calculateSafeIntercomPadding(buttonRect, windowDimensions);
    const notificationFrame = document.querySelector<HTMLElement>('[name="intercom-notification-stack-frame"]');

    if (notificationFrame) {
      notificationFrame.style.setProperty('top', `${buttonRect.bottom}px`);
      notificationFrame.style.setProperty('bottom', `unset`);
    }

    window.Intercom('update', {
      vertical_padding: vertical,
      horizontal_padding: horizontal,
      hide_default_launcher: true,
    });
  }, [displayModule]);

  // Set up dynamic positioning that responds to layout changes
  useEffect(() => {
    updatePositionRelativeToButton();

    // Start polling interval to ensure notification bubble position is updated
    // This handles cases where the iframe loads/moves asynchronously
    // Not ideal at all
    messageUpdateIntervalRef.current = setInterval(() => {
      updatePositionRelativeToButton();
    }, 500); // Update every 500ms

    // Update widget position on window resize or scroll to maintain proper spacing
    const handleLayoutChange = () => updatePositionRelativeToButton();
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange);

    // Watch for button vertical position changes using ResizeObserver on parent
    // Parent size changes can shift the button's vertical position
    let lastButtonBottom = buttonRef.current?.getBoundingClientRect().bottom;

    const buttonObserver = new ResizeObserver(() => {
      const currentBottom = buttonRef.current?.getBoundingClientRect().bottom;
      if (currentBottom !== undefined && currentBottom !== lastButtonBottom) {
        lastButtonBottom = currentBottom;
        updatePositionRelativeToButton();
      }
    });

    // Observe the button's parent container for size changes that affect button position
    if (buttonRef.current?.parentElement) {
      buttonObserver.observe(buttonRef.current.parentElement);
    }

    // Track whether the Intercom frame was previously visible
    let wasIntercomFrameVisible = !!document.querySelector('[name="intercom-notification-stack-frame"]');

    const intercomObserver = new MutationObserver(() => {
      // Check for Intercom notification frame changes
      const intercomFrame = document.querySelector('[name="intercom-notification-stack-frame"]');
      const isIntercomFrameVisible = !!intercomFrame;

      if (!isIntercomFrameVisible) {
        wasIntercomFrameVisible = false;
        return;
      }
      if (isIntercomFrameVisible !== wasIntercomFrameVisible) {
        wasIntercomFrameVisible = isIntercomFrameVisible;
        updatePositionRelativeToButton();
      }
    });

    // Observe the Intercom container if it exists
    const intercomContainer = document.querySelector('[name="intercom-container"]');
    if (intercomContainer) {
      intercomObserver.observe(intercomContainer, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      if (messageUpdateIntervalRef.current) {
        clearInterval(messageUpdateIntervalRef.current);
      }
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange);
      buttonObserver.disconnect();
      intercomObserver.disconnect();
    };
  }, [updatePositionRelativeToButton, buttonRef]);

  useEffect(() => {
    const setupHandlers = async () => {
      const store = getOpenShiftIntercomStore();

      // Wait for Intercom to be available
      while (!window.Intercom) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Register handlers
      window.Intercom('onHide', () => store.updateState('HIDE'));
      window.Intercom('onShow', () => store.updateState('SHOW'));
    };

    setupHandlers().catch((error) => console.error('Failed to setup Intercom handlers:', error));
  }, []);

  const handleToggle = useCallback(() => {
    if (!window.Intercom) return;

    if (isExpanded) {
      // Hide Intercom - this will trigger onHide which updates the store
      window.Intercom('hide');
    } else {
      if (isVAOpen) setIsVAOpen(false);
      updatePositionToDefault();
      window.Intercom('show');
    }
  }, [isExpanded, updatePositionToDefault, isVAOpen, setIsVAOpen]);

  // Only render if feature flag is enabled AND Intercom is available
  return displayModule && isIntercomAvailable ? (
    <Tooltip content={<div>Customer Success</div>}>
      <Button
        ref={buttonRef}
        variant="primary"
        aria-label="Customer Success"
        onClick={handleToggle}
        className={`${className} chr-button-intercom ${isExpanded ? 'expanded' : ''}`}
        widget-type="OpenShiftIntercom"
        icon={<RocketIconLight className={'chr-icon-intercom'} />}
      />
    </Tooltip>
  ) : null;
};

export default OpenShiftIntercomModule;
