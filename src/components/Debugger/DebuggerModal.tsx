import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { BugIcon } from '@patternfly/react-icons/dist/dynamic/icons/bug-icon';
import { ChromeUser } from '@redhat-cloud-services/types';
import { DeepRequired } from 'utility-types';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Select, SelectList, SelectOption } from '@patternfly/react-core/dist/dynamic/components/Select';

import DebuggerTable from './DebuggerTable';

import './Debugger.scss';
import { useAtom } from 'jotai';
import { isDebuggerModalOpenAtom } from '../../state/atoms/debuggerModalatom';

export type DebuggerModalProps = {
  user: DeepRequired<ChromeUser>;
};

const DebuggerModal = ({ user }: DebuggerModalProps) => {
  const [isOpen, setIsModalOpen] = useAtom(isDebuggerModalOpenAtom);
  const [isDropdownOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string>('Entitlements');
  const menuRef = React.useRef<HTMLDivElement>(null);
  const onToggleClick = () => {
    setIsOpen(!isDropdownOpen);
  };
  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, itemId: string | number | undefined) => {
    setSelected(itemId as string);
    setIsOpen(false);
  };
  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isDropdownOpen} className="chr-c-debugger-dropdown">
      {selected}
    </MenuToggle>
  );

  return (
    <React.Fragment>
      <Button
        icon={<BugIcon />}
        ouiaId="debugger-button"
        className="chr-c-button-debugger"
        onClick={() => {
          setIsModalOpen(true);
        }}
      ></Button>
      <Modal aria-label="Debugger modal" isOpen={isOpen} className="chr-c-debugger-modal" variant={ModalVariant.medium} onClose={() => setIsModalOpen(false)}>
        <div className="chr-c-debugger-content">
          <Content>
            <h1>Chrome Debugger</h1>
          </Content>
          <Select
            id="single-select"
            ref={menuRef}
            isOpen={isDropdownOpen}
            selected={selected}
            onSelect={onSelect}
            onOpenChange={(isOpen) => setIsOpen(isOpen)}
            toggle={toggle}
          >
            <SelectList>
              <SelectOption itemId="Entitlements">Entitlements</SelectOption>
              <SelectOption itemId="Roles">Roles</SelectOption>
            </SelectList>
          </Select>
          <DebuggerTable user={user} selected={selected} />
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default DebuggerModal;
