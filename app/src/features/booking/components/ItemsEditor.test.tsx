import { fireEvent, render, screen } from '@testing-library/react-native';

import { EMPTY_ITEM, ItemsEditor } from './ItemsEditor';

describe('ItemsEditor', () => {
  it('renders the list as a table with one row per item', async () => {
    await render(
      <ItemsEditor
        items={[
          { name: 'Bottled water 1L', quantity: '2', note: '' },
          { name: 'Bread', quantity: '1', note: 'Whole wheat' },
        ]}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('ITEM')).toBeOnTheScreen();
    expect(screen.getByText('QTY')).toBeOnTheScreen();
    expect(screen.getByText('NOTE')).toBeOnTheScreen();
    expect(screen.getByLabelText('Item 1 name')).toHaveDisplayValue('Bottled water 1L');
    expect(screen.getByLabelText('Item 2 note')).toHaveDisplayValue('Whole wheat');
  });

  it('edits a cell without touching the other rows', async () => {
    const onChange = jest.fn();
    await render(
      <ItemsEditor items={[EMPTY_ITEM, { ...EMPTY_ITEM, name: 'Eggs' }]} onChange={onChange} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Item 1 quantity'), '3');

    expect(onChange).toHaveBeenCalledWith([
      { ...EMPTY_ITEM, quantity: '3' },
      { ...EMPTY_ITEM, name: 'Eggs' },
    ]);
  });

  it('keeps the last row when the list may not be empty', async () => {
    const onChange = jest.fn();
    await render(<ItemsEditor items={[EMPTY_ITEM, EMPTY_ITEM]} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Remove item 2'));
    expect(onChange).toHaveBeenCalledWith([EMPTY_ITEM]);

    await screen.rerender(<ItemsEditor items={[EMPTY_ITEM]} onChange={onChange} />);
    expect(screen.queryByLabelText('Remove item 1')).toBeNull();
  });

  it('shows a row error under its row and a list error under the table', async () => {
    await render(
      <ItemsEditor
        items={[EMPTY_ITEM]}
        onChange={jest.fn()}
        errors={{ 0: { name: 'Name the item.' } }}
        listError="Add at least one item."
      />,
    );

    expect(screen.getByText('Name the item.')).toBeOnTheScreen();
    expect(screen.getByText('Add at least one item.')).toBeOnTheScreen();
  });
});
