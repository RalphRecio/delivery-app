import { Image } from 'react-native';

import { APP_NAME } from '@/config/brand';

interface LogoProps {
  size: number;
}

/** The round Pasuyo Parang badge. The PNG is already circular with transparent corners. */
export function Logo({ size }: LogoProps) {
  return (
    <Image
      source={require('../../../assets/logo.png')}
      style={{ width: size, height: size }}
      accessibilityLabel={APP_NAME}
    />
  );
}
