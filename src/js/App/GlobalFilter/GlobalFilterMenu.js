import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { TextInput, MenuList, MenuItem, Select, SelectVariant, MenuGroup, Checkbox } from '@patternfly/react-core';

import './global-filter-menu.scss';

export const groupType = {
  checkbox: 'checkbox',
  radio: 'radio',
  button: 'button',
  plain: 'plain',
};

const getMenuItems = (groups, filterValueRegex, onChange, calculateSelected) => {
  const result = groups.map(({ value, label, id, type, items, ...group }) => ({
    label,
    value,
    items: items.map((item, index) => ({
      ...item,
      key: item.id || item.value || index,
      value: String(item.value || item.id || index),
      onClick: (event) => {
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

const GlobalFilterMenu = (props) => {
  const { filterBy, onFilter, groups = [], onChange, selectedTags } = props;
  const [isOpen, setIsOpen] = useState(false);

  const calculateSelected = useCallback(
    (type, groupKey, itemKey) => {
      const activeGroup = selectedTags[groupKey];
      if (activeGroup) {
        if (type !== groupType.radio && (activeGroup[itemKey] instanceof Object ? activeGroup[itemKey].isSelected : Boolean(activeGroup[itemKey]))) {
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

  const sanitizedFilterRegex = useMemo(() => {
    try {
      return new RegExp(filterBy, 'i');
    } catch (err) {
      return new RegExp(filterBy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
  }, [filterBy]);

  const menuItems = getMenuItems(groups, sanitizedFilterRegex, onChange, calculateSelected);
  const menu = [
    <div key="global-filter-menu" className="pf-c-menu ins-c-global-filter__menu">
      {menuItems.map(({ value, label, items }) => (
        <MenuGroup key={value} label={label} value={value}>
          <MenuList>
            {items.map(({ value, label, onClick, ...props }) => (
              <MenuItem key={value} onClick={onClick}>
                <Checkbox
                  className="ins-c-global-filter__checkbox"
                  // eslint-disable-next-line react/prop-types
                  id={props.id}
                  // eslint-disable-next-line react/prop-types
                  isChecked={!!Object.values(selectedTags).find((group = {}) => group[props.tagKey]?.isSelected)}
                  label={label}
                />
              </MenuItem>
            ))}
          </MenuList>
        </MenuGroup>
      ))}
    </div>,
  ];

  return (
    <Select
      className={classNames('ins-c-global-filter__select', {
        expanded: isOpen,
      })}
      placeholderText={
        <TextInput
          onClick={(event) => {
            if (isOpen) {
              event.stopPropagation();
            }
          }}
          value={filterBy}
          onChange={onFilter}
          placeholder="Filter by status"
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

GlobalFilterMenu.propTypes = {
  filterBy: PropTypes.string,
  onFilter: PropTypes.func.isRequired,
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.node,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          tagKey: PropTypes.string,
        })
      ),
    })
  ),
  onChange: PropTypes.func.isRequired,
  selectedTags: PropTypes.shape({}),
};

export default GlobalFilterMenu;
