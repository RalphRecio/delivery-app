import { fireEvent, render, screen } from '@testing-library/react-native';

import { Pagination } from './Pagination';

const meta = { current_page: 5, last_page: 242, per_page: 10, total: 2415, from: 41, to: 50 };

describe('Pagination', () => {
  it('shows the range, the nearby pages with gaps, and reports page changes', async () => {
    const onPageChange = jest.fn();
    await render(
      <Pagination
        meta={meta}
        itemName="bookings"
        onPageChange={onPageChange}
        perPage={10}
        onPerPageChange={jest.fn()}
      />,
    );

    expect(screen.getByText('41–50')).toBeOnTheScreen();
    expect(screen.getByText('2415')).toBeOnTheScreen();
    expect(screen.getByLabelText('Page 242')).toBeOnTheScreen();
    expect(screen.getAllByText('…')).toHaveLength(2);

    await fireEvent.press(screen.getByLabelText('Page 6'));
    await fireEvent.press(screen.getByLabelText('Page ›'));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 6);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 6);
  });

  it('disables previous on the first page', async () => {
    await render(
      <Pagination
        meta={{ ...meta, current_page: 1, from: 1, to: 10 }}
        itemName="x"
        onPageChange={jest.fn()}
        perPage={10}
        onPerPageChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Page ‹')).toBeDisabled();
  });
});
