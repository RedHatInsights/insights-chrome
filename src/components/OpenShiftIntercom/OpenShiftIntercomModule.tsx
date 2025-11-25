import React, { useCallback, useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import RocketIcon from '@patternfly/react-icons/dist/esm/icons/rocket-icon';

import { openShiftIntercomExpandedAtom, intercomModuleManagerAtom, intercomModuleActionAtom } from '../../state/atoms/openShiftIntercomAtom';
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

const OpenShiftIntercomModule: React.FC<OpenShiftIntercomModuleProps> = ({
  className,
}) => {
  // Initialize atom-based state management
  const isExpanded = useAtomValue(openShiftIntercomExpandedAtom);
  const initializeIntercomManager = useSetAtom(intercomModuleManagerAtom);
  const intercomAction = useSetAtom(intercomModuleActionAtom);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const displayModule = useFlag('platform.chrome.openshift-intercom');

  /**
   * Positions Intercom widget in the default bottom-right corner with standard padding.
   * Used when the chat is opened to ensure proper placement away from the button.
   */
  const updatePositionToDefault = useCallback(() => {
    if (window.Intercom) {
      window.Intercom('update', {
        vertical_padding: INTERCOM_CONFIG.DEFAULT_PADDING,
        horizontal_padding: INTERCOM_CONFIG.DEFAULT_PADDING,
        hide_default_launcher: true
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
      height: window.innerHeight 
    };
    
    const { vertical, horizontal } = calculateSafeIntercomPadding(buttonRect, windowDimensions);
    
    window.Intercom('update', {
      vertical_padding: vertical,
      horizontal_padding: horizontal,
      hide_default_launcher: true
    });
  }, [displayModule]);

  // Set up dynamic positioning that responds to layout changes
  useEffect(() => {
    updatePositionRelativeToButton();

    // Update widget position on window resize or scroll to maintain proper spacing
    const handleLayoutChange = () => updatePositionRelativeToButton();
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange);
    
    return () => {
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange);
    };
  }, [updatePositionRelativeToButton, buttonRef]);

  // Initialize Intercom event listeners for automatic state synchronization
  useEffect(() => {
    initializeIntercomManager({ 
      updatePositionCallback: updatePositionRelativeToButton 
    });
  }, [initializeIntercomManager, updatePositionRelativeToButton]);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      intercomAction({ action: 'hide' });
    } else {
      intercomAction({ 
        action: 'show', 
        updatePositionCallback: updatePositionToDefault 
      });
    }
  }, [isExpanded, intercomAction, updatePositionToDefault]);

  return displayModule ? (
    <Tooltip
      content={<div>Customer Success</div>}
    >
      <Button
        ref={buttonRef}
        variant="primary"
        aria-label="Customer Success"
        onClick={handleToggle}
        className={`chr-c-toolbar__button-intercom ${isExpanded ? 'expanded' : ''}`}
        widget-type="OpenShiftIntercom"
      >
        <RocketIcon className="chr-c-toolbar__icon-intercom" />
      </Button>
    </Tooltip>
  ) : null;
};

export default OpenShiftIntercomModule;
