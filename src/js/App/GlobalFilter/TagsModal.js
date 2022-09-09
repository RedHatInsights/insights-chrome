import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TagModal } from '@redhat-cloud-services/frontend-components/TagModal';
import { fetchAllSIDs, fetchAllTags } from '../../redux/actions';
import debounce from 'lodash/debounce';
import flatMap from 'lodash/flatMap';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const useMetaSelector = (key) =>
  useSelector(
    ({ globalFilter: { [key]: selected } }) => [selected?.isLoaded, selected?.total || 0, selected?.page || 1, selected?.perPage || 10],
    shallowEqual
  );

const TagsModal = ({ isOpen, filterTagsBy, onApplyTags, toggleModal, selectedTags }) => {
  const intl = useIntl();
  const [tagsSelected, setTagsSelected] = useState([]);
  const [sidsSelected, setSidsSelected] = useState([]);
  const [filterBy, setFilterBy] = useState('');
  const [filterSIDsBy, setFilterSIDsBy] = useState('');
  const dispatch = useDispatch();
  const [tagsLoaded, tagsCount, tagsPage, tagsPerPage] = useMetaSelector('tags');
  const [sidLoaded, sidCount, sidPage, sidPerPage] = useMetaSelector('sid');
  const tags = useSelector(({ globalFilter: { tags } }) => tags?.items || []);
  const sids = useSelector(({ globalFilter: { sid } }) => sid?.items || []);
  const filterScope = useSelector(({ globalFilter: { scope } }) => scope || undefined);
  const debounceGetTags = useCallback(
    debounce((search) => {
      dispatch(
        fetchAllTags(
          {
            registeredWith: filterScope,
            activeTags: selectedTags,
            search,
          },
          { page: tagsPage, perPage: tagsPerPage }
        )
      );
    }, 800),
    []
  );
  const debounceGetSIDs = useCallback(
    debounce((search) => {
      dispatch(
        fetchAllSIDs(
          {
            registeredWith: filterScope,
            activeTags: selectedTags,
            search,
          },
          { page: sidPage, perPage: sidPerPage }
        )
      );
    }, 800),
    []
  );
  useEffect(() => {
    setFilterBy(filterTagsBy);
    setFilterSIDsBy(filterTagsBy);
  }, [filterTagsBy]);

  return (
    <TagModal
      tabNames={['tags', 'SAP IDs (SID)']}
      tableProps={{
        canSelectAll: false,
      }}
      pagination={[
        ...(tagsLoaded
          ? [
              {
                perPage: tagsPerPage,
                page: tagsPage,
                count: tagsCount,
              },
            ]
          : [{}]),
        ...(sidLoaded
          ? [
              {
                perPage: sidPerPage,
                page: sidPage,
                count: sidCount,
              },
            ]
          : [{}]),
      ]}
      rows={[
        ...(tagsLoaded
          ? [
              flatMap(tags, ({ tags }) =>
                tags?.map(({ tag: { key, value, namespace } } = { tag: {} }) => ({
                  id: `${namespace}/${key}=${value}`,
                  namespace,
                  key,
                  value,
                  selected: tagsSelected?.find?.(({ id } = {}) => id === `${namespace}/${key}=${value}`),
                  cells: [key, value, namespace],
                }))
              ),
            ]
          : [[]]),
        ...(sidLoaded
          ? [
              flatMap(sids, ({ tags }) =>
                tags?.map(({ tag: { key, namespace } } = { tag: {} }) => ({
                  namespace,
                  id: key,
                  key,
                  selected: sidsSelected?.find?.(({ id } = {}) => id === key),
                  cells: [key],
                }))
              ),
            ]
          : [[]]),
      ]}
      loaded={[tagsLoaded, sidLoaded]}
      width="50%"
      isOpen={isOpen}
      toggleModal={(_e, isSubmit) => {
        setSidsSelected([]);
        setTagsSelected([]);
        setFilterBy('');
        setFilterSIDsBy('');
        toggleModal(isSubmit);
      }}
      filters={[
        [
          {
            label: `${intl.formatMessage(messages.tagsFilter)}`,
            placeholder: `${intl.formatMessage(messages.filterTags)}`,
            value: 'tags-filter',
            filterValues: {
              value: filterBy,
              onChange: (_e, value) => {
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
            filterValues: {
              value: filterSIDsBy,
              onChange: (_e, value) => {
                setFilterSIDsBy(() => value);
                debounceGetSIDs(value);
              },
            },
          },
        ],
      ]}
      onUpdateData={[
        (pagination) =>
          dispatch(
            fetchAllTags(
              {
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterBy,
              },
              pagination
            )
          ),
        (pagination) =>
          dispatch(
            fetchAllSIDs(
              {
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterSIDsBy,
              },
              pagination
            )
          ),
      ]}
      columns={[
        [
          { title: `${intl.formatMessage(messages.name)}` },
          { title: `${intl.formatMessage(messages.value)}` },
          { title: `${intl.formatMessage(messages.tagSources)}` },
        ],
        [{ title: `${intl.formatMessage(messages.value)}` }],
      ]}
      onSelect={[setTagsSelected, setSidsSelected]}
      selected={[tagsSelected, sidsSelected]}
      onApply={() => onApplyTags(tagsSelected, sidsSelected)}
      title={intl.formatMessage(messages.selectTagsOrSIDs)}
      ouiaId="global-filter-tags-modal"
    />
  );
};
TagsModal.propTypes = {
  isOpen: PropTypes.bool,
  selectedTags: PropTypes.object,
  filterTagsBy: PropTypes.string,
  onApplyTags: PropTypes.func,
  toggleModal: PropTypes.func,
};
TagsModal.defaultProps = {
  isOpen: false,
  selectedTags: {},
  onApplyTags: () => undefined,
  toggleModal: () => undefined,
};

export default TagsModal;
