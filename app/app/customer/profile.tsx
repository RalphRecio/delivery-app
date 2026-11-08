import { CurrentUserCard } from '@/features/auth';
import { PushNotificationsCard } from '@/features/notifications';
import { Screen, ScreenHeader } from '@/shared/ui';

export default function ProfileScreen() {
  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Your account" />
      <CurrentUserCard />
      <PushNotificationsCard />
    </Screen>
  );
}
