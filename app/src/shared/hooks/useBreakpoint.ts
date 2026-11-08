import { useWindowDimensions } from 'react-native';

/** Below this width the admin area stacks like the phone screens; above it, the sidebar layout. */
export const DESKTOP_MIN_WIDTH = 1024;

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  return { isDesktop: width >= DESKTOP_MIN_WIDTH, width };
}
