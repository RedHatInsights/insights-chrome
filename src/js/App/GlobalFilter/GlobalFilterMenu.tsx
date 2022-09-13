import React, { Fragment, useCallback, useState } from 'react';
import classNames from 'classnames';
import { Bullseye, Checkbox, MenuGroup, MenuItem, MenuList, Select, SelectVariant, Spinner, TextInput } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import messages from '../../Messages';

import './global-filter-menu.scss';
import { ReduxState } from '../../redux/store';

export const groupType = {
  checkbox: 'checkbox',
  radio: 'radio',
  button: 'button',
  plain: 'plain',
} as const;

export type GlobalFilterMenuGroupKeys = keyof typeof groupType;
export type GlobalFilterMenuGroupValues = typeof groupType[GlobalFilterMenuGroupKeys];

export type FulterMenuItem = {
  value: string;
  label: React.ReactNode;
  onClick: (event: Event) => void;
  id: string;
  tagKey: string;
  tagValue: string;
  items: unknown[];
};

export type FilterMenuGroup = {
  noFilter?: boolean;
  value: string;
  label: string;
  id: string;
  type: GlobalFilterMenuGroupValues;
  items: FulterMenuItem[];
};

export type FilterMenuItemOnChange = (
  event: Event,
  selected: unknown,
  selectedItem: {
    value: string;
    label: string;
    id: string;
    type: unknown;
    items: FulterMenuItem[];
  },
  item: {
    id?: string;
    value?: string;
  },
  value: string,
  itemValue: string
) => void;
type CalculateSelected = (type: GlobalFilterMenuGroupValues, value: string, itemValue: string) => void;

const getMenuItems = (
  groups: FilterMenuGroup[],
  onChange: FilterMenuItemOnChange,
  calculateSelected: CalculateSelected
): { noFilter?: boolean; label: string; value: string; items: FulterMenuItem[] }[] => {
  const result = groups.map(({ value, label, id, type, items, ...group }) => ({
    label,
    value,
    noFilter: group.noFilter,
    items: items.map((item, index) => ({
      ...item,
      key: item.id || item.value || index,
      value: String(item.value || item.id || index),
      onClick: (event: Event) => {
        onChange(
          event,
          calculateSelected(type, value, item.value),
          {
            value,
            label,
            id,
            type,
            items,
            ...group,
          },
          item,
          value,
          item.value
        );
      },
    })),
  }));
  return result.filter(({ noFilter, items = [] }) => noFilter || items.length > 0);
};

/** Create unique hotjar event for selected tags */
const generateGlobalFilterEvent = (isChecked: boolean, value: string) => `global_filter_tag_${isChecked ? 'uncheck' : 'check'}_${value}`;

export type GlobalFilterMenuProps = {
  setTagModalOpen: (isOpen: boolean) => void;
  hotjarEventEmitter: ((eventType: string, eventName: string) => void) | (() => void);
  filterBy?: string | number;
  onFilter?: (value: string) => void;
  groups?: FilterMenuGroup[];
  onChange: FilterMenuItemOnChange;
  selectedTags: {
    [key: string]: {
      [key: string]:
        | string
        | boolean
        | number
        | {
            isSelected: boolean;
          };
    };
  };
};

const GlobalFilterMenu = (props: GlobalFilterMenuProps) => {
  const intl = useIntl();
  const { filterBy, onFilter, groups = [], onChange, selectedTags, hotjarEventEmitter } = props;
  const isLoading = useSelector<ReduxState, boolean | undefined>(
    ({ globalFilter }) => !(globalFilter?.sid?.isLoaded && globalFilter?.tags?.isLoaded && globalFilter?.workloads?.isLoaded)
  );
  const isDisabled = useSelector<ReduxState, boolean>(({ globalFilter }) => globalFilter.globalFilterHidden);
  const [isOpen, setIsOpen] = useState(false);

  const calculateSelected = useCallback(
    (type: GlobalFilterMenuGroupValues, groupKey: string, itemKey: string) => {
      const activeGroup = selectedTags[groupKey];
      if (activeGroup) {
        const activeGroupItem = activeGroup[itemKey];
        if (type !== groupType.radio && (activeGroupItem instanceof Object ? activeGroupItem.isSelected : Boolean(activeGroupItem))) {
          return {
            ...selectedTags,
            [groupKey]: {
              ...(activeGroup || {}),
              [itemKey]: false,
            },
          };
        }

        return {
          ...selectedTags,
          [groupKey]: {
            ...(type !== groupType.radio ? activeGroup || {} : {}),
            [itemKey]: true,
          },
        };
      }

      return {
        ...selectedTags,
        [groupKey]: {
          [itemKey]: true,
        },
      };
    },
    [selectedTags]
  );

  const menuItems = getMenuItems(groups, onChange, calculateSelected);
  const menu = [
    <div onClick={(event) => event.stopPropagation()} key="global-filter-menu" className="pf-c-menu chr-c-menu-global-filter">
      {isLoading ? (
        <MenuList>
          <MenuItem>
            <Bullseye>
              <Spinner size="md" />
            </Bullseye>
          </MenuItem>
        </MenuList>
      ) : (
        <Fragment>
          {menuItems.map(({ value, label, items }) => (
            <MenuGroup key={value} label={label} value={value}>
              <MenuList>
                {items.map(({ value, label, onClick, id, tagKey, tagValue }) => {
                  const isChecked =
                    // eslint-disable-next-line react/prop-types
                    !!Object.values(selectedTags).find((tags = {}) => {
                      const tag = tags[`${tagKey}=${tagValue}`];
                      return typeof tag === 'object' && tag?.isSelected;
                    }) ||
                    // eslint-disable-next-line react/prop-types
                    !!Object.values(selectedTags).find((group = {}) => {
                      const tagGroup = group[tagKey];
                      return typeof tagGroup === 'object' && group?.isSelected;
                    });
                  return (
                    <MenuItem
                      key={value}
                      onClick={(...args) => {
                        hotjarEventEmitter('event', generateGlobalFilterEvent(isChecked, value));
                        return onClick(...args);
                      }}
                    >
                      <Checkbox className="chr-c-check-global-filter" ouiaId="global-filter-checkbox" id={id} isChecked={isChecked} label={label} />
                    </MenuItem>
                  );
                })}
              </MenuList>
            </MenuGroup>
          ))}
          <MenuGroup>
            <MenuList>
              <MenuItem onClick={() => props.setTagModalOpen(true)} isLoadButton>
                {intl.formatMessage(messages.showMore)}
              </MenuItem>
            </MenuList>
          </MenuGroup>
        </Fragment>
      )}
    </div>,
  ];

  return (
    <Select
      isDisabled={isDisabled}
      className={classNames('chr-c-menu-global-filter__select', {
        expanded: isOpen,
      })}
      ouiaId="global-filter-select"
      placeholderText={
        <TextInput
          isDisabled={isDisabled}
          onClick={(event) => {
            if (isOpen) {
              event.stopPropagation();
            }
          }}
          value={filterBy}
          onChange={onFilter}
          placeholder="Filter by tags"
          aria-label="Filter by tags"
          ouiaId="global-filter-by-status"
        />
      }
      variant={SelectVariant.typeahead}
      onTypeaheadInputChanged={onFilter}
      onToggle={(isOpen) => {
        setIsOpen(isOpen);
      }}
      isOpen={isOpen}
      hasInlineFilter
      customContent={menu}
    >
      {menu}
    </Select>
  );
};

export default GlobalFilterMenu;
