import React, { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { CogIcon } from '@patternfly/react-icons/dist/dynamic/icons/cog-icon';
import { useSetAtom } from 'jotai';
import { hidePreviewBannerAtom } from '../../state/atoms/releaseAtom';

const BetaSwitcherDropdown = () => {
  const hidePreview = useSetAtom(hidePreviewBannerAtom);
  const [isOpen, setIsOpen] = useState(false);

  const onToggleClick = () => {
    setIsOpen((prev) => !prev);
  };

  const description = (
    <Content component="small">
      You can enable &quot;Preview&quot; from the Settings menu <CogIcon /> at any time.
    </Content>
  );

  return (
    <Dropdown
      className="chr-c-beta-switcher-dropdown"
      popperProps={{
        position: 'end',
      }}
      isOpen={isOpen}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          className="pf-v6-u-icon-color-inverse pf-v6-u-pt-0 pf-v6-u-pb-0"
          ref={toggleRef}
          aria-label="hide preview banner"
          variant="plain"
          onClick={onToggleClick}
          isExpanded={isOpen}
          icon={<EllipsisVIcon />}
        />
      )}
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem
          onClick={() => {
            hidePreview(true);
            setIsOpen(false);
          }}
          description={description}
          key="hide-preview-banner"
        >
          Hide &quot;Preview&quot; banner
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export default BetaSwitcherDropdown;
