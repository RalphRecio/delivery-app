import { formatDistance } from '@/shared/lib/format';
import type { PaginationMeta } from '@/shared/types/api';
import { DataTable, dataTableText, Pagination, Text, type DataTableColumn } from '@/shared/ui';

import { bookingStatusTone } from '../lib/bookingStatusTone';
import type { AdminBooking } from '../types';
import { StatusPill } from '../ui';

interface BookingsTableProps {
  rows: AdminBooking[];
  meta: PaginationMeta | undefined;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onOpen: (booking: AdminBooking) => void;
  isLoading: boolean;
}

const COLUMNS: DataTableColumn<AdminBooking>[] = [
  {
    key: 'reference',
    title: 'Booking',
    flex: 1.5,
    render: (b) => (
      <>
        <Text style={dataTableText.strong}>{b.reference}</Text>
        <Text style={dataTableText.secondary}>
          Created {new Date(b.created_at).toLocaleString()}
        </Text>
      </>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    flex: 1.1,
    render: (b) => <StatusPill label={b.status_label} tone={bookingStatusTone(b.status)} />,
  },
  {
    key: 'service',
    title: 'Service',
    flex: 1.4,
    render: (b) => (
      <>
        <Text style={dataTableText.primary} numberOfLines={1}>
          {b.service_label}
        </Text>
        <Text style={dataTableText.secondary}>{formatDistance(b.fare.distance_meters)}</Text>
      </>
    ),
  },
  {
    key: 'customer',
    title: 'Customer',
    flex: 1.2,
    render: (b) => (
      <>
        <Text style={dataTableText.primary}>{b.customer?.name ?? 'No name'}</Text>
        <Text style={dataTableText.secondary}>{b.customer?.phone ?? ''}</Text>
      </>
    ),
  },
  {
    key: 'rider',
    title: 'Rider',
    flex: 1.2,
    render: (b) =>
      b.rider === null || b.rider === undefined ? (
        <Text style={dataTableText.secondary}>—</Text>
      ) : (
        <>
          <Text style={dataTableText.primary}>{b.rider.name ?? 'No name'}</Text>
          <Text style={dataTableText.secondary}>{b.rider.phone}</Text>
        </>
      ),
  },
  {
    key: 'route',
    title: 'From → To',
    flex: 1.9,
    render: (b) => (
      <>
        <Text style={dataTableText.primary} numberOfLines={1}>
          {b.pickup.address}
        </Text>
        <Text style={dataTableText.secondary} numberOfLines={1}>
          → {b.dropoff.address}
        </Text>
      </>
    ),
  },
  {
    key: 'fare',
    title: 'Fare',
    flex: 0.7,
    render: (b) => <Text style={dataTableText.primary}>{b.fare.total.formatted}</Text>,
  },
];

export function BookingsTable({
  rows,
  meta,
  perPage,
  onPageChange,
  onPerPageChange,
  onOpen,
  isLoading,
}: BookingsTableProps) {
  return (
    <DataTable
      isEmbedded
      columns={COLUMNS}
      rows={rows}
      keyOf={(b) => String(b.id)}
      rowLabel={(b) => `Booking ${b.reference}`}
      onRowPress={onOpen}
      emptyText={isLoading ? 'Loading…' : 'No bookings match.'}
      footer={
        meta !== undefined && (
          <Pagination
            meta={meta}
            itemName="bookings"
            perPage={perPage}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        )
      }
    />
  );
}
