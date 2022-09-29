import React from 'react';
import { GroupFilter, groupType } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import { useIntl } from 'react-intl';

import messages from '../../Messages';

import './global-filter-menu.scss';

export type GlobalFilterMenuGroupKeys = keyof typeof groupType;
export type GlobalFilterMenuGroupValues = typeof groupType[GlobalFilterMenuGroupKeys];

export type FilterMenuItem = {
  value: string;
  label: React.ReactNode;
  onClick: (event: Event, selected: unknown, group: unknown, currItem: unknown, groupName: string, itemName: string) => void;
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
  items: FilterMenuItem[];
};

export type FilterMenuItemOnChange = (
  event: Event,
  selected: unknown,
  selectedItem: {
    value: string;
    label: string;
    id: string;
    type: unknown;
    items: FilterMenuItem[];
  },
  item: {
    id?: string;
    value?: string;
  },
  value: string,
  itemValue: string
) => void;

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
  return (
    <GroupFilter
      className="chr-c-menu-global-filter__select"
      selected={props.selectedTags}
      groups={props.groups?.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          onClick: (e: Event, selected: any, group: unknown, currItem: unknown, groupName: string, itemName: string) => {
            generateGlobalFilterEvent(selected?.[groupName]?.[itemName]?.isSelected, item.value);
            item.onClick(e, selected, group, currItem, groupName, itemName);
          },
        })),
      }))}
      onChange={props.onChange}
      placeholder={intl.formatMessage(messages.filterByTags)}
      isFilterable
      onFilter={props.onFilter}
      filterBy={props.filterBy as string}
      showMoreTitle={intl.formatMessage(messages.showMore)}
      onShowMore={() => props.setTagModalOpen(true)}
      showMoreOptions={{
        isLoadButton: true,
      }}
    />
  );
};

export default GlobalFilterMenu;
