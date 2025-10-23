import React, { Fragment, useContext, useMemo } from 'react';
import { Group, GroupType } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import './global-filter-menu.scss';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Chip, ChipGroup } from '@patternfly/react-core/dist/dynamic/deprecated/components/Chip';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import TagsModal from './TagsModal';
import { FilterMenuItemOnChange } from '@redhat-cloud-services/frontend-components/ConditionalFilter/groupFilterConstants';
import { CommonSelectedTag } from '../../state/atoms/globalFilterAtom';
import { updateSelected } from './globalFilterApi';
import { FlagTagsFilter } from '../../@types/types';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import GroupFilterInputGroup from './GroupFilterInputGroup';
import { globalFilterScopeAtom } from '../../state/atoms/globalFilterAtom';
import { useAtomValue } from 'jotai';
import { getAllTags } from './tagsApi';

export type GlobalFilterMenuGroupKeys = GroupType;

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
  type: GroupType;
  items: FilterMenuItem[];
};

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
  isDisabled?: boolean;
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
  isDisabled = false,
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
  const registeredWith = useAtomValue(globalFilterScopeAtom);
  const auth = useContext(ChromeAuthContext);
  const intl = useIntl();
  const GroupFilterWrapper = useMemo(
    () => (!allowed || isDisabled ? Tooltip : ({ children }: { children: any }) => <Fragment>{children}</Fragment>),
    [allowed, isDisabled]
  );

  return (
    <Fragment>
      <Split id="global-filter" hasGutter className="chr-c-global-filter">
        <SplitItem>
          {auth.ready && allowed !== undefined ? (
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
              <GroupFilterInputGroup filter={filter} isDisabled={isDisabled} selectedTags={selectedTags} setIsOpen={setIsOpen} />
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
                  <Button
                    variant="link"
                    className="pf-v6-u-ml-sm"
                    ouiaId="global-filter-clear"
                    onClick={() => {
                      setValue(() => ({}));
                      filter?.onFilter?.('');
                    }}
                  >
                    {intl.formatMessage(messages.resetFilters)}
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
              getAllTags({
                registeredWith: registeredWith as 'insights',
                activeTags: selectedTags,
                search: filterTagsBy,
              });
            }
            hotjarEventEmitter('event', 'global_filter_bulk_action');
            setIsOpen(false);
          }}
          onApplyTags={(selected: CommonSelectedTag[], sidSelected: CommonSelectedTag[]) => {
            setValue(() =>
              [...(selected || []), ...(sidSelected || [])].reduce<FlagTagsFilter>((acc: FlagTagsFilter, { key, value, namespace }: CommonSelectedTag) => {
                return updateSelected(acc, namespace as string, `${key}${value ? `=${value}` : ''}`, value as string, true, {
                  item: { tagKey: key },
                });
              }, selectedTags)
            );
          }}
        />
      )}
      <Divider />
    </Fragment>
  );
};

export default GlobalFilterDropdown;
