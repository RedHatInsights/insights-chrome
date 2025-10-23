import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { BaseInventoryColumn, InventoryColumn, LocalColumnData } from './InventoryColumn';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import SecurityIcon from '@patternfly/react-icons/dist/dynamic/icons/security-icon';
import TagIcon from '@patternfly/react-icons/dist/dynamic/icons/tag-icon';

import { AdvisorSystem, Host, HostApiOptions, getHostCVEs, getHostInsights, getHostPatch, getHostTags, getHosts } from './api';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import ShieldIcon from '@patternfly/react-icons/dist/dynamic/icons/shield-alt-icon';
import BugIcon from '@patternfly/react-icons/dist/dynamic/icons/bug-icon';
import CogIcon from '@patternfly/react-icons/dist/dynamic/icons/cog-icon';
import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import FilterToolbar from './FilterToolbar';

function createRows(
  columns: {
    isReady?: () => boolean;
    isAsync?: () => boolean;
    getColumnData: () => LocalColumnData;
  }[]
) {
  const rowNumber = columns.reduce<number>((acc, column) => {
    if (!column.isAsync?.()) {
      return Math.max(acc, column.getColumnData().length);
    }
    return acc;
  }, 0);
  const allData = columns.reduce<ReactNode[][]>((acc, column) => {
    if (column.isAsync?.() && !column.isReady?.()) {
      for (let i = 0; i < rowNumber; i++) {
        if (!acc[i]) {
          acc[i] = [];
        }
        acc[i].push(<Skeleton />);
      }

      return acc;
    }
    const data = column.getColumnData();
    for (let i = 0; i < data.length; i++) {
      if (!acc[i]) {
        acc[i] = [];
      }
      acc[i].push(data[i]);
    }
    return acc;
  }, []);

  return allData;
}

function useColumnData(columns: InventoryColumn[]) {
  const hasRemoteColumns = columns.some((column) => {
    return column.isAsync?.();
  });
  const [ready, setReady] = React.useState(!hasRemoteColumns);
  function initLocalData() {
    if (hasRemoteColumns) {
      return new Array(columns.length).fill([]);
    }
    return createRows(
      columns as {
        isAsync?: () => boolean;
        getColumnData: () => LocalColumnData;
      }[]
    );
  }
  const [data, setData] = React.useState<ReactNode[][]>(initLocalData);

  useEffect(() => {
    setReady(!hasRemoteColumns);
    setData(
      createRows(
        columns as {
          isAsync?: () => boolean;
          getColumnData: () => LocalColumnData;
        }[]
      )
    );
    const promises: Promise<void>[] = [];
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].isAsync?.() && typeof columns[i].observeReady === 'function') {
        const P = new Promise<void>((resolve) => {
          columns[i].observeReady?.(resolve);
        });
        promises.push(P);
        P.then(() => {
          setData(
            createRows(
              columns as {
                isAsync?: () => boolean;
                getColumnData: () => LocalColumnData;
              }[]
            )
          );
        });
      }
    }

    return () => {
      setReady(true);
      setData([]);
    };
  }, [columns]);

  const res = useMemo<[ReactNode[][], boolean]>(() => [data, ready], [data, ready]);

  return res;
}

const ModularInventory = ({
  columns,
  onSort,
  sortBy,
  sortDirection,
}: {
  sortBy: number;
  sortDirection: 'asc' | 'desc';
  onSort: (index: number, direction: 'asc' | 'desc') => void;
  columns: Omit<InventoryColumn, 'isReady' | 'isAsync' | 'observeReady'>[];
}) => {
  const [allData] = useColumnData(columns as InventoryColumn[]);
  return (
    <Table>
      <Thead>
        <Tr>
          {columns.map((column, idx) => (
            <Th
              sort={
                column.getSortable()
                  ? {
                      columnIndex: idx,
                      sortBy: {
                        index: sortBy,
                        direction: sortDirection,
                      },
                      onSort: (_e, index, direction) => onSort(index, direction),
                    }
                  : undefined
              }
              key={column.getColumnId()}
            >
              {column.getTitle()}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {allData.map((row, index) => (
          <Tr key={index}>
            {row.map((cell, cellIndex) => (
              <Td key={cellIndex}>{cell}</Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const columnIds = [
  'id',
  'display_name',
  'all-cves',
  'cves',
  'tags',
  'os',
  'updated',
  'criticalCves',
  'importantCves',
  'moderateCves',
  'lowCves',
  'recommendations',
  'installAbleAdvisories',
];

const ColumnEnabler = ({
  enabledColumns,
  handleCheckboxChange,
}: {
  enabledColumns: { [key: string]: boolean };
  handleCheckboxChange: (columnId: string) => void;
}) => {
  return (
    <Toolbar>
      <ToolbarContent>
        {columnIds.map((columnId) => (
          <ToolbarItem key={columnId}>
            <Checkbox isChecked={enabledColumns[columnId]} onChange={() => handleCheckboxChange(columnId)} label={columnId} id={columnId} />
          </ToolbarItem>
        ))}
      </ToolbarContent>
    </Toolbar>
  );
};

const columnsRegistry: {
  [key: string]: (
    hosts: Host[],
    cvePromises: ReturnType<typeof getHostCVEs>[],
    systemPromises: Promise<AdvisorSystem | 'unknown'>[],
    patchPromises: ReturnType<typeof getHostPatch>[]
  ) => InventoryColumn | BaseInventoryColumn;
} = {
  criticalCves: (_h, _c, systemPromises) => {
    return new InventoryColumn('criticalCves', 'Critical', {
      columnData: async () => {
        const res = await Promise.all(systemPromises);
        return res.map((r) => {
          if (r === 'unknown') {
            return 'Unknown';
          }
          return r.critical_hits;
        });
      },
    });
  },
  importantCves: (_h, _c, systemPromises) => {
    return new InventoryColumn('importantCves', 'Important', {
      columnData: async () => {
        const res = await Promise.all(systemPromises);
        return res.map((r) => {
          if (r === 'unknown') {
            return 'Unknown';
          }
          return r.important_hits;
        });
      },
    });
  },
  moderateCves: (_h, _c, systemPromises) => {
    return new InventoryColumn('moderateCves', 'Moderate', {
      columnData: async () => {
        const res = await Promise.all(systemPromises);
        return res.map((r) => {
          if (r === 'unknown') {
            return 'Unknown';
          }
          return r.moderate_hits;
        });
      },
    });
  },
  lowCves: (_h, _c, systemPromises) => {
    return new InventoryColumn('lowCves', 'Low', {
      columnData: async () => {
        const res = await Promise.all(systemPromises);
        return res.map((r) => {
          if (r === 'unknown') {
            return 'Unknown';
          }
          return r.low_hits;
        });
      },
    });
  },
  recommendations: (_h, _c, systemPromises) => {
    return new InventoryColumn('recommendations', 'Recommendations', {
      columnData: async () => {
        const res = await Promise.all(systemPromises);
        return res.map((r) => {
          if (r === 'unknown') {
            return 'Unknown';
          }
          return r.low_hits + r.moderate_hits + r.important_hits + r.critical_hits;
        });
      },
    });
  },
  installAbleAdvisories: (_h, _c, _s, patchPromises) => {
    return new InventoryColumn('installAbleAdvisories', 'Installable advisories', {
      columnData: async () => {
        const res = await Promise.all(patchPromises);
        return res.map((r) => {
          if (r === 'unknown') {
            return 'unknown';
          }
          return (
            <>
              <span className="pf-v6-u-mr-sm">
                <ShieldIcon className="pf-v6-u-mr-sm" />
                {r.attributes.installable_rhsa_count}
              </span>
              <span className="pf-v6-u-mr-sm">
                <BugIcon className="pf-v6-u-mr-sm" />
                {r.attributes.installable_rhba_count}
              </span>
              <span className="pf-v6-u-mr-sm">
                <CogIcon className="pf-v6-u-mr-sm" />
                {r.attributes.installable_rhea_count}
              </span>
            </>
          );
        });
      },
    });
  },

  id: (hosts: Host[]) => {
    return new BaseInventoryColumn(
      'id',
      'System ID',
      {
        columnData: hosts.map((host) => host.id),
      },
      { sortable: true }
    );
  },

  display_name: (hosts: Host[]) => {
    return new BaseInventoryColumn(
      'display_name',
      'System Name',
      {
        columnData: hosts.map((host) => (
          <a key={host.id} href="#">
            {host.display_name}
          </a>
        )),
      },
      {
        sortable: true,
      }
    );
  },

  'all-cves': (_e, cvePromises: ReturnType<typeof getHostCVEs>[]) => {
    return new InventoryColumn('all-cves', 'Total CVEs', {
      columnData: async () => {
        const res = await Promise.all(cvePromises);
        return res.map((r, index) => (
          <a key={index} href="#">
            {r.allCount}
          </a>
        ));
      },
    });
  },

  cves: (_e, cvePromises: ReturnType<typeof getHostCVEs>[]) => {
    return new InventoryColumn('cves', 'High severity CVEs', {
      columnData: async () => {
        const res = await Promise.all(cvePromises);
        return res.map((r, index) => {
          return (
            <>
              <span key={index} className="pf-v6-u-mr-md">
                <Icon status="danger" className="pf-v6-u-mr-sm">
                  <SecurityIcon />
                </Icon>
                <a href="#">{r.criticalCount}</a>
              </span>
              <span>
                <Icon status="warning" className="pf-v6-u-mr-sm">
                  <SecurityIcon />
                </Icon>
                <a href="#">{r.highCount}</a>
              </span>
            </>
          );
        });
      },
    });
  },

  tags: (hosts: Host[]) =>
    new InventoryColumn('tags', 'Tags??', {
      columnData: async () => {
        const promises = hosts.map((host) => {
          if (!host.id) {
            return { count: 0, results: {} };
          }
          return getHostTags(host.id);
        });
        const res = await Promise.all(promises);
        return res.map((r, index) => {
          const tagCount = Object.values(r.results).reduce((acc, curr) => acc + curr, 0);
          return (
            <span key={index}>
              <TagIcon className="pf-v6-u-mr-md" />
              {tagCount}
            </span>
          );
        });
      },
    }),

  os: (hosts: Host[]) => {
    return new BaseInventoryColumn('os', 'OS', {
      columnData: hosts.map((host) =>
        host.system_profile.operating_system ? (
          <span key={host.id}>
            {host.system_profile.operating_system.name}&nbsp;
            {host.system_profile.operating_system.major}.{host.system_profile.operating_system.minor}
          </span>
        ) : (
          'Not available'
        )
      ),
    });
  },

  updated: (hosts: Host[]) => {
    return new BaseInventoryColumn(
      'updated',
      'Last check-in',
      {
        columnData: hosts.map((host) =>
          host.per_reporter_staleness.puptoo?.last_check_in ? <DateFormat key={host.id} date={host.per_reporter_staleness.puptoo?.last_check_in} /> : null
        ),
      },
      {
        sortable: true,
      }
    );
  },
};

const ModularInventoryRoute = () => {
  const [hosts, setHosts] = React.useState<Host[]>([]);
  const [enabledColumns, setEnabledColumns] = useState(
    columnIds.reduce<{ [key: string]: boolean }>((acc, curr) => {
      acc[curr] = true;
      return acc;
    }, {})
  );

  const handleCheckboxChange = (columnId: string) => {
    setEnabledColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };
  const cols = useMemo(() => {
    const cvePromises = hosts.map((host) => {
      if (!host.id) {
        return { criticalCount: 0, highCount: 0, allCount: 0 };
      }
      return getHostCVEs(host.id);
    });
    const systemPromises = hosts.map((host) => {
      return getHostInsights(host.id);
    });

    const patchPromises = hosts.map((host) => {
      return getHostPatch(host.id);
    });

    const cols = columnIds
      .filter((columnId) => enabledColumns[columnId])
      .map((columnId) => {
        return columnsRegistry[columnId](hosts, cvePromises as any, systemPromises, patchPromises);
      });

    return cols;
  }, [hosts, enabledColumns]);

  async function initData() {
    const response = await getHosts(filterState);
    setHosts(response.results);
    getHostTags(response.results[0].insights_id);
  }
  const [filterState, setFilterState] = useState<HostApiOptions>({ page: 1, perPage: 20, orderBy: 'updated', orderHow: 'DESC' });

  useEffect(() => {
    initData();
  }, [JSON.stringify(filterState)]);

  const onPerPageSelect = (perPage: number) => {
    setFilterState((prev) => ({ ...prev, perPage }));
  };
  const onSetPage = (page: number) => {
    setFilterState((prev) => ({ ...prev, page }));
  };

  return (
    <div className="pf-v6-u-p-md">
      <ColumnEnabler enabledColumns={enabledColumns} handleCheckboxChange={handleCheckboxChange} />
      <FilterToolbar onPerPageSelect={onPerPageSelect} onSetPage={onSetPage} {...filterState} />
      <ModularInventory
        sortBy={filterState.orderBy ? (columnIds.indexOf(filterState.orderBy) ?? 0) : 0}
        sortDirection={filterState.orderHow?.toLocaleLowerCase() as 'asc' | 'desc'}
        onSort={(index, direction) => {
          console.log(index, direction);
          setFilterState((prev) => ({
            ...prev,
            orderBy: (columnIds[index] as any) ?? 'updated',
            orderHow: (direction.toUpperCase() as any) ?? 'DESC',
          }));
        }}
        columns={cols}
      />
    </div>
  );
};

export default ModularInventoryRoute;
