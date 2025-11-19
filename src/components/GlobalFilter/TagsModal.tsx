import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TagModal } from '@redhat-cloud-services/frontend-components/TagModal';
import debounce from 'lodash/debounce';
import flatMap from 'lodash/flatMap';
import { useIntl } from 'react-intl';
import { TagFilterOptions, TagPagination, getAllTags } from './tagsApi';
import { TableWithFilterPagination } from '@redhat-cloud-services/frontend-components/TagModal/TableWithFilter';
import { OnSelectRow, OnUpdateData } from '@redhat-cloud-services/frontend-components/TagModal/TagModal';
import messages from '../../locales/Messages';
import { FlagTagsFilter } from '../../@types/types';
import {
  CommonSelectedTag,
  CommonTag,
  GlobalFilterTag,
  globalFilterScopeAtom,
  tagsAtom,
  workloadsAtom,
} from '../../state/atoms/globalFilterAtom';
import { useAtomValue } from 'jotai';

export type TagsModalProps = {
  isOpen?: boolean;
  filterTagsBy: string;
  toggleModal: (isSubmit: boolean) => void;
  selectedTags?: FlagTagsFilter;
  onApplyTags: (tags: CommonSelectedTag[]) => void;
};

export type IDMapper = (tag: CommonTag) => string;
export type CellsMapper = (tag: CommonTag) => (string | number | boolean | undefined)[];
export type DebounceCallback = (filters?: TagFilterOptions, pagination?: TagPagination) => void | Promise<any>;

export const useMetaSelector = (key: 'tags' | 'workloads'): [boolean, number, number, number] => {
  const tags = useAtomValue(tagsAtom);
  const workloads = useAtomValue(workloadsAtom);
  const selected = { tags, workloads }[key];

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

const useRow = (resource: GlobalFilterTag[], loaded: boolean | unknown, idMapper: IDMapper, cellsMapper: CellsMapper, selected?: GlobalFilterTag[]) => {
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
  const [filterBy, setFilterBy] = useState('');
  const { items: tags } = useAtomValue(tagsAtom);
  const [tagsLoaded, tagsCount, tagsPage, tagsPerPage] = useMetaSelector('tags');
  const filterScope = useAtomValue(globalFilterScopeAtom);
  const debounceGetTags = useDebounce(getAllTags, tagsPerPage, selectedTags);
  useEffect(() => {
    setFilterBy(filterTagsBy);
  }, [filterTagsBy]);

  const tagsPagination = usePagination(tagsLoaded, tagsPerPage, tagsPage, tagsCount);
  const tagsRows = useRow(
    tags,
    tagsLoaded,
    ({ key, value, namespace }) => `${namespace}/${key}=${value}`,
    ({ key, value, namespace }) => [key, value, namespace],
    tagsSelected
  );

  return (
    <TagModal
      tabNames={['tags']}
      tableProps={{
        canSelectAll: false,
      }}
      pagination={[tagsPagination] as TableWithFilterPagination[]}
      rows={[tagsRows]}
      loaded={[tagsLoaded as boolean]}
      width="50%"
      isOpen={isOpen as boolean}
      toggleModal={(_e?: any, open?: boolean) => {
        setTagsSelected([]);
        setFilterBy('');
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
        ] as OnUpdateData[]
      }
      columns={[
        [
          { title: `${intl.formatMessage(messages.name)}` },
          { title: `${intl.formatMessage(messages.value)}` },
          { title: `${intl.formatMessage(messages.tagSources)}` },
        ],
      ]}
      onSelect={
        [(selected) => setTagsSelected(selected as CommonSelectedTag[])] as OnSelectRow[]
      }
      selected={[tagsSelected]}
      onApply={() => onApplyTags(tagsSelected)}
      title={intl.formatMessage(messages.selectTagsOrSIDs)}
      ouiaId="global-filter-tags-modal"
    />
  );
};

export default TagsModal;
