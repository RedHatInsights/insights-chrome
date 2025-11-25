import React, { useCallback, useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import RocketIcon from '@patternfly/react-icons/dist/esm/icons/rocket-icon';

import { openShiftIntercomExpandedAtom, toggleOpenShiftIntercomAtom } from '../../state/atoms/openShiftIntercomAtom';
import './OpenShiftIntercom.scss';
import { useFlag } from '@unleash/proxy-client-react';

export type OpenShiftIntercomModuleProps = {
  className?: string;
};

const OpenShiftIntercomModule: React.FC<OpenShiftIntercomModuleProps> = ({
  className,
}) => {
  // Use internal state management
  const isExpanded = useAtomValue(openShiftIntercomExpandedAtom);
  const toggleIntercom = useSetAtom(toggleOpenShiftIntercomAtom);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const displayModule = useFlag('platform.chrome.openshift-intercom');

  const updateIntercomPosition = useCallback(() => {
    if (!displayModule) {
      return;
    }

    if (window.Intercom && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      // Calculate vertical padding from bottom of screen
      const paddingFromBottom = windowHeight - buttonRect.bottom;
      const verticalPadding = Math.max(20, Math.min(windowHeight, paddingFromBottom));
      
      // Calculate horizontal padding from right of screen
      const paddingFromRight = windowWidth - buttonRect.right;
      const horizontalPadding = Math.max(20, Math.min(windowWidth, paddingFromRight));
      
      window.Intercom('update', {
        vertical_padding: verticalPadding,
        horizontal_padding: horizontalPadding,
        hide_default_launcher: true
      });
    }
  }, []);

  useEffect(() => {
    updateIntercomPosition();
    
    // Update position on window resize or scroll
    const handleUpdate = () => updateIntercomPosition();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [updateIntercomPosition]);

  const handleToggle = useCallback(() => {
    if (window.Intercom) {
      toggleIntercom();
      // Toggle based on current state
      if (isExpanded) {
        window.Intercom('hide');
      } else {
        window.Intercom('show');
      }
    } else {
      console.warn('Intercom widget not available. Using fallback toggle.');
    }
  }, [isExpanded, toggleIntercom]);

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
