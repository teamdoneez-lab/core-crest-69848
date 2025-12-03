// Stubbed - requires service_requests table
interface PhotoNotification {
  requestId: string;
  type: 'photos_requested' | 'photos_uploaded';
  timestamp: string;
}

export function usePhotoNotifications() {
  return {
    notifications: [] as PhotoNotification[],
    hasNewPhotos: false,
    hasPhotoRequests: false,
    addNotification: (_requestId: string, _type: PhotoNotification['type']) => {},
    clearNotification: (_requestId: string, _type?: PhotoNotification['type']) => {},
    clearAllNotifications: () => {},
    getNotificationsForRequest: (_requestId: string) => [] as PhotoNotification[],
  };
}
