import type { PaginationMeta } from '@/shared/types/api';
import { DataTable, dataTableText, Pagination, Text, type DataTableColumn } from '@/shared/ui';

import type { AdminStore } from '../types';
import { StatusPill } from '../ui';

interface StoresTableProps {
  rows: AdminStore[];
  meta: PaginationMeta | undefined;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onOpen: (store: AdminStore) => void;
  isLoading: boolean;
}

/** Desktop list of stores: name and address, kind, items available, and whether it is open. */
export function StoresTable({
  rows,
  meta,
  perPage,
  onPageChange,
  onPerPageChange,
  onOpen,
  isLoading,
}: StoresTableProps) {
  const columns: DataTableColumn<AdminStore>[] = [
    {
      key: 'name',
      title: 'Store',
      flex: 2,
      render: (store) => (
        <>
          <Text style={dataTableText.strong}>{store.name}</Text>
          <Text style={dataTableText.secondary} numberOfLines={1}>
            {store.address}
          </Text>
        </>
      ),
    },
    {
      key: 'category',
      title: 'Kind',
      render: (store) => <Text style={dataTableText.primary}>{store.category_label}</Text>,
    },
    {
      key: 'items',
      title: 'Items available',
      render: (store) => (
        <Text style={dataTableText.primary}>
          {store.available_products_count ?? 0} of {store.products_count ?? 0}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      flex: 0.8,
      render: (store) =>
        store.is_active ? (
          <StatusPill label="Open" tone="green" />
        ) : (
          <StatusPill label="Hidden" tone="gray" />
        ),
    },
  ];

  return (
    <DataTable
      isEmbedded
      columns={columns}
      rows={rows}
      keyOf={(store) => String(store.id)}
      onRowPress={onOpen}
      rowLabel={(store) => `Store ${store.name}`}
      emptyText={isLoading ? 'Loading stores…' : 'No stores yet. Add the first one.'}
      footer={
        meta !== undefined && (
          <Pagination
            meta={meta}
            itemName="stores"
            onPageChange={onPageChange}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
          />
        )
      }
    />
  );
}
