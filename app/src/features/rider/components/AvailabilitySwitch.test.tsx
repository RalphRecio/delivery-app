import { fireEvent, render, screen } from '@testing-library/react-native';

import { AvailabilitySwitch } from './AvailabilitySwitch';

describe('AvailabilitySwitch', () => {
  it('reports the new value when toggled', async () => {
    const onChange = jest.fn();
    await render(<AvailabilitySwitch isOnline={false} onChange={onChange} isSaving={false} />);

    expect(screen.getByText('You are offline')).toBeOnTheScreen();

    await fireEvent(screen.getByLabelText('Online'), 'valueChange', true);

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
