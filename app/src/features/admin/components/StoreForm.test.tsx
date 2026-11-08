import { fireEvent, render, screen } from '@testing-library/react-native';

import { StoreForm } from './StoreForm';

jest.mock('@/features/map', () => {
  const { Text } = jest.requireActual('react-native');

  return {
    EMPTY_PICKED_LOCATION: { address: '', landmark: '', details: '', point: null },
    // The map is replaced by a stand-in that "drops the pin" when pressed.
    LocationPicker: ({
      onChange,
      errors,
    }: {
      onChange: (value: object) => void;
      errors?: { point?: string; address?: string };
    }) => (
      <>
        <Text
          accessibilityRole="button"
          onPress={() =>
            onChange({
              address: 'Poblacion, Parang',
              landmark: 'Beside the fish section',
              details: '',
              point: { latitude: 7.3745, longitude: 124.2689 },
            })
          }
        >
          Drop pin
        </Text>
        {errors?.point !== undefined && <Text>{errors.point}</Text>}
        {errors?.address !== undefined && <Text>{errors.address}</Text>}
      </>
    ),
  };
});

describe('StoreForm', () => {
  it('needs a name and a pin before it submits', async () => {
    const onSubmit = jest.fn();
    await render(<StoreForm submitLabel="Add store" onSubmit={onSubmit} isSubmitting={false} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Add store' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Name the store.')).toBeOnTheScreen();
    expect(screen.getByText('Drop the pin on the store.')).toBeOnTheScreen();
  });

  it('submits the store with its category and coordinates', async () => {
    const onSubmit = jest.fn();
    await render(<StoreForm submitLabel="Add store" onSubmit={onSubmit} isSubmitting={false} />);

    await fireEvent.changeText(screen.getByLabelText('Store name'), ' Stall 12 ');
    await fireEvent.press(screen.getByText('Restaurant'));
    await fireEvent.press(screen.getByRole('button', { name: 'Drop pin' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add store' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Stall 12',
      category: 'restaurant',
      address: 'Poblacion, Parang',
      landmark: 'Beside the fish section',
      latitude: 7.3745,
      longitude: 124.2689,
      is_active: true,
    });
  });
});
