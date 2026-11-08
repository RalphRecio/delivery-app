/**
 * Jest stand-in for expo-router, applied to every test automatically.
 * The real package pulls in ESM navigation code Jest cannot load, and unit
 * tests never need real routing. A test that asserts on navigation can
 * still override this with its own jest.mock('expo-router', ...).
 */
import type { PropsWithChildren } from 'react';

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
  setParams: jest.fn(),
};

export const useRouter = () => router;
export const usePathname = jest.fn(() => '/');
export const useLocalSearchParams = jest.fn(() => ({}));
export const useGlobalSearchParams = jest.fn(() => ({}));

export const Redirect = () => null;
export const Slot = () => null;
export const Stack = () => null;
export const Link = ({ children }: PropsWithChildren) => children;

export type Href = string;
