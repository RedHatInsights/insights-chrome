import React, { FormEvent, Fragment, MouseEventHandler, useMemo } from 'react';
import { Group, GroupFilter, groupType } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import { useIntl } from 'react-intl';

import messages from '../../locales/Messages';

import './global-filter-menu.scss';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Chip, ChipGroup, Divider, Skeleton, Split, SplitItem, Tooltip } from '@patternfly/react-core';
import TagsModal from './TagsModal';
import { FilterMenuItemOnChange } from '@redhat-cloud-services/frontend-components/ConditionalFilter/groupFilterConstants';
import { CommonSelectedTag, ReduxState } from '../../redux/store';
import { updateSelected } from './globalFilterApi';
import { fetchAllTags } from '../../redux/actions';
import { FlagTagsFilter } from '../../@types/types';

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

/** Create unique hotjar event for selected tags */
const generateGlobalFilterEvent = (isChecked: boolean, value?: string) => `global_filter_tag_${isChecked ? 'uncheck' : 'check'}_${value}`;

export type SelectedTags = {
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

export type GlobalFilterDropdownProps = {
  allowed: boolean;
  isDisabled: boolean;
  filter: {
    filterBy?: string | number;
    onFilter?: (value: string) => void;
    groups?: Group[];
    onChange: FilterMenuItemOnChange;
  };
  chips: { category: string; key?: string; chips: { key: string; tagKey: string; value: string }[] }[];
  filterTagsBy: string;
  setValue: (callback?: () => unknown) => void;
  setIsOpen: (callback?: ((origValue?: boolean) => void) | boolean) => void;
  isOpen: boolean;
  hotjarEventEmitter?: ((eventType: string, eventName: string) => void) | (() => void);
  selectedTags: FlagTagsFilter;
};

export const GlobalFilterDropdown: React.FunctionComponent<GlobalFilterDropdownProps> = ({
  allowed,
  isDisabled,
  filter,
  chips,
  setValue,
  selectedTags,
  isOpen,
  filterTagsBy,
  setIsOpen,
}) => {
  /**
   * Hotjar API reference: https://help.hotjar.com/hc/en-us/articles/4405109971095-Events-API-Reference#the-events-api-call
   * window.hj is only avaiable in console.redhat.com and console.redhat.com/beta
   * We are unable to test it in any local development environment
   * */
  const hotjarEventEmitter = typeof window.hj === 'function' ? window.hj : () => undefined;
  const registeredWith = useSelector(({ globalFilter: { scope } }: ReduxState) => scope);
  const userLoaded = useSelector(({ chrome: { user } }: ReduxState) => Boolean(user));
  const intl = useIntl();
  const dispatch = useDispatch();
  const GroupFilterWrapper = useMemo(
    () => (!allowed || isDisabled ? Tooltip : ({ children }: { children: any }) => <Fragment>{children}</Fragment>),
    [allowed, isDisabled]
  );
  return (
    <Fragment>
      <Split id="global-filter" hasGutter className="chr-c-global-filter">
        <SplitItem>
          {userLoaded && allowed !== undefined ? (
            <GroupFilterWrapper
              content={
                !allowed || isDisabled
                  ? !allowed
                    ? `${intl.formatMessage(messages.noInventoryPermissions)}`
                    : `${intl.formatMessage(messages.globalFilterNotApplicable)}`
                  : ''
              }
              position="right"
            >
              <GroupFilter
                className="chr-c-menu-global-filter__select"
                selected={selectedTags}
                isDisabled={isDisabled}
                groups={filter.groups?.map((group) => ({
                  ...group,
                  items: group.items.map((item) => ({
                    ...item,
                    onClick: (
                      e: FormEvent | MouseEventHandler<HTMLInputElement> | undefined,
                      selected: any,
                      group: number | undefined,
                      currItem: boolean | undefined,
                      groupName: string | undefined,
                      itemName: string | undefined
                    ) => {
                      generateGlobalFilterEvent((selected?.[groupName as string]?.[itemName as string] as Group)?.isSelected as boolean, item.value);
                      item.onClick?.(e, selected, group, currItem, groupName, itemName);
                    },
                  })),
                }))}
                onChange={filter.onChange}
                placeholder={intl.formatMessage(messages.filterByTags)}
                isFilterable
                onFilter={filter.onFilter}
                filterBy={filter.filterBy as string}
                showMoreTitle={intl.formatMessage(messages.showMore)}
                onShowMore={() => setIsOpen(true)}
                showMoreOptions={{
                  isLoadButton: true,
                }}
              />
            </GroupFilterWrapper>
          ) : (
            <Skeleton fontSize={'xl'} />
          )}
        </SplitItem>
        {allowed && (
          <SplitItem isFilled>
            {chips?.length > 0 && (
              <Fragment>
                {chips.map(({ category, chips }, key) => (
                  <ChipGroup key={key} categoryName={category} className={category === 'Workloads' ? 'chr-c-chip' : ''}>
                    {chips?.map(({ key: chipName, tagKey, value }, chipKey) => (
                      <Chip
                        key={chipKey}
                        onClick={() => setValue(() => updateSelected(selectedTags, category, chipName, value, false, {}))}
                        isReadOnly={isDisabled}
                      >
                        {tagKey}
                        {value ? `=${value}` : ''}
                      </Chip>
                    ))}
                  </ChipGroup>
                ))}
                {!isDisabled && (
                  <Button variant="link" ouiaId="global-filter-clear" onClick={() => setValue(() => ({}))}>
                    {intl.formatMessage(messages.clearFilters)}
                  </Button>
                )}
              </Fragment>
            )}
          </SplitItem>
        )}
      </Split>
      {isOpen && (
        <TagsModal
          isOpen={isOpen}
          filterTagsBy={filterTagsBy}
          selectedTags={selectedTags}
          toggleModal={(isSubmit) => {
            if (!isSubmit) {
              dispatch(
                fetchAllTags({
                  registeredWith: registeredWith as 'insights',
                  activeTags: selectedTags,
                  search: filterTagsBy,
                })
              );
            }
            hotjarEventEmitter('event', 'global_filter_bulk_action');
            setIsOpen(false);
          }}
          onApplyTags={(selected: CommonSelectedTag[], sidSelected: CommonSelectedTag[]) => {
            setValue(() =>
              [...(selected || []), ...(sidSelected || [])].reduce<FlagTagsFilter>(
                (acc: FlagTagsFilter, { key, value, namespace }: CommonSelectedTag) => {
                  return updateSelected(acc, namespace as string, `${key}${value ? `=${value}` : ''}`, value as string, true, {
                    item: { tagKey: key },
                  });
                },
                selectedTags
              )
            );
          }}
        />
      )}
      <Divider />
    </Fragment>
  );
};

export default GlobalFilterDropdown;
