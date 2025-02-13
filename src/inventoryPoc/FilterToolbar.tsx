import React from 'react';
import { HostApiOptions } from './api';
import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';

export type FilterToolbarProps = HostApiOptions & {
  onSetPage: (page: number) => void;
  onPerPageSelect: (perPage: number) => void;
};

const FilterToolbar = (props: FilterToolbarProps) => {
  const { page, perPage, onSetPage, onPerPageSelect } = props;
  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Pagination
              onPerPageSelect={(_e, newPerPage) => onPerPageSelect(newPerPage)}
              onSetPage={(_e, newPage) => onSetPage(newPage)}
              page={page}
              perPage={perPage}
              perPageOptions={[5, 10, 20, 50, 100].map((i) => ({ title: `${i}`, value: i }))}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </>
  );
};

export default FilterToolbar;
