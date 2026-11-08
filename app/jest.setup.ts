// Environment the app expects at startup (see src/config/env.ts).
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000/api/v1';

// Native secure storage is not available in Jest; tests get an in-memory stand-in.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();

  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

// Native modules the map feature touches; tests exercise the hooks with these stand-ins.
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 10.3157, longitude: 123.8854 },
  })),
  reverseGeocodeAsync: jest.fn(async () => [{ street: 'Osmeña Blvd', city: 'Cebu City' }]),
}));

// react-native-maps has no JS fallback in Jest; a plain View stands in for the map.
jest.mock('react-native-maps', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props: object, ref: unknown) =>
    React.createElement(View, { ...props, ref }),
  );
  MockMapView.displayName = 'MapView';

  return { __esModule: true, default: MockMapView };
});

// Icon fonts cannot load in Jest; render the icon name as text instead.
jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  const Icon = ({ name }: { name: string }) => React.createElement(Text, null, name);

  return { Ionicons: Icon };
});
