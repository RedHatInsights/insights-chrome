import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TagModal } from '@redhat-cloud-services/frontend-components/TagModal';
import debounce from 'lodash/debounce';
import flatMap from 'lodash/flatMap';
import { useIntl } from 'react-intl';
import { TagFilterOptions, TagPagination, getAllSIDs, getAllTags } from './tagsApi';
import { TableWithFilterPagination } from '@redhat-cloud-services/frontend-components/TagModal/TableWithFilter';
import { OnSelectRow, OnUpdateData } from '@redhat-cloud-services/frontend-components/TagModal/TagModal';
import messages from '../../locales/Messages';
import { FlagTagsFilter } from '../../@types/types';
import {
  CommonSelectedTag,
  CommonTag,
  GlobalFilterTag,
  SID,
  globalFilterScopeAtom,
  sidsAtom,
  tagsAtom,
  workloadsAtom,
} from '../../state/atoms/globalFilterAtom';
import { useAtomValue } from 'jotai';

export type TagsModalProps = {
  isOpen?: boolean;
  filterTagsBy: string;
  toggleModal: (isSubmit: boolean) => void;
  selectedTags?: FlagTagsFilter;
  onApplyTags: (tags: CommonSelectedTag[], sids: CommonSelectedTag[]) => void;
};

export type IDMapper = (tag: CommonTag) => string;
export type CellsMapper = (tag: CommonTag) => (string | number | boolean | undefined)[];
export type DebounceCallback = (filters?: TagFilterOptions, pagination?: TagPagination) => void | Promise<any>;

export const useMetaSelector = (key: 'tags' | 'workloads' | 'sid'): [boolean, number, number, number] => {
  const tags = useAtomValue(tagsAtom);
  const workloads = useAtomValue(workloadsAtom);
  const sids = useAtomValue(sidsAtom);
  const selected = { tags, workloads, sid: sids }[key];

  return [selected?.isLoaded ?? false, selected?.total ?? 0, selected?.page ?? 1, selected?.perPage ?? 10];
};

const usePagination = (loaded: boolean | unknown, perPage?: number, page?: number, count?: number) => {
  return useMemo(() => {
    if (loaded) {
      return {
        perPage: perPage,
        page: page,
        count: count,
      };
    }
    return {};
  }, [loaded, perPage, page, count]);
};

const useRow = (resource: SID[] | GlobalFilterTag[], loaded: boolean | unknown, idMapper: IDMapper, cellsMapper: CellsMapper, selected?: GlobalFilterTag[]) => {
  return useMemo(() => {
    if (loaded) {
      return flatMap(resource, ({ tags }) =>
        tags?.map(({ tag }) => ({
          id: idMapper(tag),
          namespace: tag.namespace,
          key: tag.key,
          value: tag.value,
          selected: selected?.find?.(({ id }) => id === idMapper(tag)),
          cells: cellsMapper(tag),
        }))
      );
    }
    return [];
  }, [resource, loaded, selected]);
};

const useDebounce = (callback: DebounceCallback, perPage: number, activeTags?: FlagTagsFilter) => {
  const registeredWith = useAtomValue(globalFilterScopeAtom);
  return useCallback(
    debounce((search?: string) => {
      callback(
        {
          registeredWith,
          activeTags,
          search,
        },
        { page: 1, perPage }
      );
    }, 800),
    [perPage, registeredWith, activeTags]
  );
};

const TagsModal = ({ isOpen = false, filterTagsBy, onApplyTags = () => undefined, toggleModal = () => undefined, selectedTags = {} }: TagsModalProps) => {
  const intl = useIntl();
  const [tagsSelected, setTagsSelected] = useState<CommonSelectedTag[]>([]);
  const [sidsSelected, setSidsSelected] = useState<CommonSelectedTag[]>([]);
  const [filterBy, setFilterBy] = useState('');
  const [filterSIDsBy, setFilterSIDsBy] = useState('');
  const { items: tags } = useAtomValue(tagsAtom);
  const { items: sids } = useAtomValue(sidsAtom);
  const [tagsLoaded, tagsCount, tagsPage, tagsPerPage] = useMetaSelector('tags');
  const [sidLoaded, sidCount, sidPage, sidPerPage] = useMetaSelector('sid');
  const filterScope = useAtomValue(globalFilterScopeAtom);
  const debounceGetTags = useDebounce(getAllTags, tagsPerPage, selectedTags);
  const debounceGetSIDs = useDebounce(getAllSIDs, sidPerPage, selectedTags);
  useEffect(() => {
    setFilterBy(filterTagsBy);
    setFilterSIDsBy(filterTagsBy);
  }, [filterTagsBy]);

  const tagsPagination = usePagination(tagsLoaded, tagsPerPage, tagsPage, tagsCount);
  const sidPagination = usePagination(sidLoaded, sidPerPage, sidPage, sidCount);
  const tagsRows = useRow(
    tags,
    tagsLoaded,
    ({ key, value, namespace }) => `${namespace}/${key}=${value}`,
    ({ key, value, namespace }) => [key, value, namespace],
    tagsSelected
  );
  const sidRows = useRow(
    sids ?? [],
    sidLoaded,
    ({ key }) => key as string,
    ({ key }) => [key],
    sidsSelected
  );

  return (
    <TagModal
      tabNames={['tags', 'SAP IDs (SID)']}
      tableProps={{
        canSelectAll: false,
      }}
      pagination={[tagsPagination, sidPagination] as TableWithFilterPagination[]}
      rows={[tagsRows, sidRows]}
      loaded={[tagsLoaded as boolean, sidLoaded as boolean]}
      width="50%"
      isOpen={isOpen as boolean}
      toggleModal={(_e?: any, open?: boolean) => {
        setSidsSelected([]);
        setTagsSelected([]);
        setFilterBy('');
        setFilterSIDsBy('');
        toggleModal(!!open);
      }}
      filters={[
        [
          {
            label: `${intl.formatMessage(messages.tagsFilter)}`,
            placeholder: `${intl.formatMessage(messages.filterTags)}`,
            value: 'tags-filter',
            type: 'text',
            filterValues: {
              value: filterBy,
              onChange: (_e: any, value?: any) => {
                setFilterBy(() => value);
                debounceGetTags(value);
              },
            },
          },
        ],
        [
          {
            label: `${intl.formatMessage(messages.SIDsFilter)}`,
            placeholder: `${intl.formatMessage(messages.filterSAPIDs)}`,
            value: 'sids-filter',
            type: 'text',
            filterValues: {
              value: filterSIDsBy,
              onChange: (_e: any, value: any) => {
                setFilterSIDsBy(() => value);
                debounceGetSIDs(value);
              },
            },
          },
        ],
      ]}
      onUpdateData={
        [
          (pagination: TagPagination) => {
            getAllTags(
              {
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterBy,
              },
              pagination
            );
          },
          (pagination: TagPagination) => {
            getAllSIDs(
              {
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterSIDsBy,
              },
              pagination
            );
          },
        ] as OnUpdateData[]
      }
      columns={[
        [
          { title: `${intl.formatMessage(messages.name)}` },
          { title: `${intl.formatMessage(messages.value)}` },
          { title: `${intl.formatMessage(messages.tagSources)}` },
        ],
        [{ title: `${intl.formatMessage(messages.value)}` }],
      ]}
      onSelect={
        [(selected) => setTagsSelected(selected as CommonSelectedTag[]), (selected) => setSidsSelected(selected as CommonSelectedTag[])] as OnSelectRow[]
      }
      selected={[tagsSelected, sidsSelected]}
      onApply={() => onApplyTags(tagsSelected, sidsSelected)}
      title={intl.formatMessage(messages.selectTagsOrSIDs)}
      ouiaId="global-filter-tags-modal"
    />
  );
};

export default TagsModal;
