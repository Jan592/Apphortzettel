import { useEffect } from 'react';
import { api } from '../utils/api';

interface NotificationBadgeManagerProps {
  userRole?: 'parent' | 'hortner' | 'admin';
  klasse?: string;
}

export function NotificationBadgeManager({ userRole, klasse }: NotificationBadgeManagerProps) {
  useEffect(() => {
    // If there's no user logged in, clear the badge and stop polling
    if (!userRole) {
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(console.error);
      }
      return;
    }

    const checkMessages = async () => {
      try {
        let unreadCount = 0;

        if (userRole === 'admin') {
          // Fetch admin messages
          const response = await api.getAdminMessages();
          if (response?.messages) {
            unreadCount = response.messages.filter((msg: any) => msg.status === 'ungelesen').length;
          }
        } else if (userRole === 'hortner') {
          if (klasse) {
            const response = await api.getHortnerMessages(klasse);
            if (response?.messages) {
              unreadCount = response.messages.filter((msg: any) => msg.status === 'ungelesen').length;
            }
          }
        } else {
          // Parent views messages via getMessages
          const response = await api.getMessages();
          if (response?.messages) {
            // Unread for parents means "beantwortet" and "replyRead == false"
            unreadCount = response.messages.filter((msg: any) => msg.status === 'beantwortet' && !msg.replyRead).length;
          }
        }

        // Set App Badge
        if ('setAppBadge' in navigator) {
          if (unreadCount > 0) {
            // @ts-ignore
            navigator.setAppBadge(unreadCount).catch(console.error);
          } else {
            // @ts-ignore
            navigator.clearAppBadge().catch(console.error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages for badge:', error);
      }
    };

    // Check immediately on mount/role change
    checkMessages();

    // Check every 2 minutes
    const intervalId = setInterval(checkMessages, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [userRole]);

  return null; // This component doesn't render anything
}
