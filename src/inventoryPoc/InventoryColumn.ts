import { ReactNode } from 'react';
import { getModule } from '@scalprum/core';

export type RemoteColumnData<T extends Array<unknown> = unknown[]> = {
  scope: string;
  module: string;
  importName?: string;
  initArgs?: T;
};
export type BaseColumnData = ReactNode[];
export type ColumnData = BaseColumnData | RemoteColumnData | (() => Promise<BaseColumnData>);
export type LocalColumnData = ReactNode[];

export function isRemoteColumn(columnData: ColumnData): columnData is RemoteColumnData {
  return (columnData as RemoteColumnData).module !== undefined || (columnData as RemoteColumnData).scope !== undefined;
}

export function isAsyncColumnData(columnData: ColumnData): columnData is () => Promise<BaseColumnData> {
  return typeof columnData === 'function';
}

export class BaseInventoryColumn {
  private columnId: string;
  private title: ReactNode;
  private columnData: BaseColumnData;
  private sortable?: boolean = false;

  constructor(columnId: string, title: ReactNode, { columnData }: { columnData: BaseColumnData }, { sortable }: { sortable?: boolean } = {}) {
    this.columnId = columnId;
    this.title = title;
    this.columnData = columnData;
    this.sortable = sortable;
  }

  getColumnId(): string {
    return this.columnId;
  }

  getTitle(): ReactNode {
    return this.title;
  }

  getColumnData(): BaseColumnData {
    return this.columnData;
  }

  getSortable(): boolean {
    return !!this.sortable;
  }

  setColumnData(columnData: BaseColumnData): void {
    this.columnData = columnData;
  }

  setColumnId(columnId: string): void {
    this.columnId = columnId;
  }

  setColumnTitle(title: ReactNode): void {
    this.title = title;
  }
}

export class InventoryColumn extends BaseInventoryColumn {
  private asyncModule?: boolean = false;
  private ready?: boolean = true;
  private observeReadyCallbacks: (() => void)[] = [];

  constructor(columnId: string, title: ReactNode, { columnData }: { columnData: ColumnData }) {
    if (isRemoteColumn(columnData)) {
      super(columnId, title, { columnData: [] });
      this.asyncModule = true;
      this.ready = false;
      getModule<(...args: unknown[]) => InventoryColumn>(columnData.scope, columnData.module, columnData.importName).then((remoteColumnInit) => {
        const remoteColumn = remoteColumnInit(...(columnData.initArgs || []));
        if (remoteColumn?.isAsync?.()) {
          const p = new Promise<void>((res) => {
            remoteColumn.observeReady(res);
          });
          p.then(() => {
            this.setColumnId(remoteColumn.getColumnId());
            this.setColumnTitle(remoteColumn.getTitle());
            this.setColumnData(remoteColumn.getColumnData());
            this.ready = true;
            this.observeReadyCallbacks.forEach((callback) => callback());
          });
        } else {
          this.setColumnId(remoteColumn.getColumnId());
          this.setColumnTitle(remoteColumn.getTitle());
          this.setColumnData(remoteColumn.getColumnData());
          this.ready = true;
          this.observeReadyCallbacks.forEach((callback) => callback());
        }
      });
    } else if (isAsyncColumnData(columnData)) {
      super(columnId, title, { columnData: [] });
      this.asyncModule = true;
      this.ready = false;
      columnData().then((data) => {
        this.setColumnData(data);
        this.ready = true;
        this.observeReadyCallbacks.forEach((callback) => callback());
      });
    } else {
      super(columnId, title, { columnData: columnData as BaseColumnData });
    }
  }

  isAsync(): boolean {
    return !!this.asyncModule;
  }

  isReady(): boolean {
    return !!this.ready;
  }

  observeReady(callback: () => void): void {
    this.observeReadyCallbacks.push(callback);
  }
}
