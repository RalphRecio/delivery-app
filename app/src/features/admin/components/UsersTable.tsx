import { formatPhilippineMobile } from '@/features/auth';
import type { PaginationMeta } from '@/shared/types/api';
import { DataTable, dataTableText, Pagination, Text, type DataTableColumn } from '@/shared/ui';

import { useSetUserActivation } from '../hooks/useAdminQueries';
import type { AdminRider, AdminUser } from '../types';
import { AdminButton, StatusPill } from '../ui';

type Row = AdminUser | AdminRider;

interface UsersTableProps {
  rows: Row[];
  meta: PaginationMeta | undefined;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  selfId: number | undefined;
  isLoading: boolean;
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function UsersTable({
  rows,
  meta,
  perPage,
  onPageChange,
  onPerPageChange,
  selfId,
  isLoading,
}: UsersTableProps) {
  const activation = useSetUserActivation();

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      title: 'Name',
      flex: 1.4,
      render: (u) => (
        <>
          <Text style={dataTableText.strong}>{u.name}</Text>
          <Text style={dataTableText.secondary}>{u.email}</Text>
        </>
      ),
    },
    {
      key: 'phone',
      title: 'Mobile',
      flex: 1.1,
      render: (u) => <Text style={dataTableText.primary}>{formatPhilippineMobile(u.phone)}</Text>,
    },
    {
      key: 'role',
      title: 'Role',
      flex: 0.6,
      render: (u) => <Text style={dataTableText.primary}>{capitalise(u.role)}</Text>,
    },
    {
      key: 'status',
      title: 'Status',
      flex: 1,
      render: (u) =>
        !u.is_active ? (
          <StatusPill label="Deactivated" tone="red" />
        ) : 'is_online' in u ? (
          <StatusPill
            label={u.is_online ? 'Online' : 'Offline'}
            tone={u.is_online ? 'green' : 'gray'}
          />
        ) : (
          <StatusPill label="Active" tone="green" />
        ),
    },
    {
      key: 'job',
      title: 'Current job',
      flex: 1,
      render: (u) =>
        'active_job_reference' in u && u.active_job_reference !== undefined ? (
          <StatusPill label={u.active_job_reference} tone="indigo" />
        ) : (
          <Text style={dataTableText.secondary}>—</Text>
        ),
    },
    {
      key: 'actions',
      title: 'Actions',
      flex: 1.2,
      render: (u) =>
        u.id === selfId ? (
          <Text style={dataTableText.secondary}>You</Text>
        ) : (
          <AdminButton
            variant="outline"
            label={u.is_active ? 'Deactivate' : 'Reactivate'}
            onPress={() => activation.mutate({ id: u.id, isActive: !u.is_active })}
            isLoading={activation.isPending && activation.variables?.id === u.id}
          />
        ),
    },
  ];

  return (
    <DataTable
      isEmbedded
      columns={columns}
      rows={rows}
      keyOf={(u) => String(u.id)}
      rowLabel={(u) => `User ${u.phone}`}
      emptyText={isLoading ? 'Loading…' : 'Nobody matches.'}
      footer={
        meta !== undefined && (
          <Pagination
            meta={meta}
            itemName="users"
            perPage={perPage}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        )
      }
    />
  );
}
