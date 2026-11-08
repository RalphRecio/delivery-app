import { EmptyState, Screen, ScreenHeader } from '@/shared/ui';

/**
 * Placeholder until in-app chat exists. Says so plainly and points to what
 * works today: the rider's number on the booking.
 */
export default function MessagesScreen() {
  return (
    <Screen>
      <ScreenHeader title="Messages" subtitle="Chat with your rider" />
      <EmptyState
        icon="chatbubble-ellipses-outline"
        title="No messages yet"
        hint="Chat with your rider is coming soon. For now, open your booking to see your rider's number and call them."
      />
    </Screen>
  );
}
