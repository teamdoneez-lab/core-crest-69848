import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PhotoNotification {
  requestId: string;
  type: 'photos_requested' | 'photos_uploaded';
  timestamp: string;
}

export function usePhotoNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PhotoNotification[]>([]);
  const [hasNewPhotos, setHasNewPhotos] = useState(false);
  const [hasPhotoRequests, setHasPhotoRequests] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    checkNotifications();
    
    // Set up real-time subscription for photo request updates
    const channel = supabase
      .channel('photo-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.additional_photos_requested) {
            addNotification(payload.new.id, 'photos_requested');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkNotifications = async () => {
    if (!user) return;

    // Load from localStorage
    const stored = localStorage.getItem(`photo-notifications-${user.id}`);
    const storedNotifications: PhotoNotification[] = stored ? JSON.parse(stored) : [];
    
    setNotifications(storedNotifications);
    
    // Check for photo requests (customer side)
    const { data: requestsWithPhotoRequest } = await supabase
      .from('service_requests')
      .select('id, additional_photos_requested')
      .eq('customer_id', user.id)
      .eq('additional_photos_requested', true);
    
    setHasPhotoRequests((requestsWithPhotoRequest?.length || 0) > 0);
    
    // Check for new photo uploads (pro side)
    const hasNewUploads = storedNotifications.some(n => n.type === 'photos_uploaded');
    setHasNewPhotos(hasNewUploads);
  };

  const addNotification = (requestId: string, type: PhotoNotification['type']) => {
    if (!user) return;
    
    const newNotification: PhotoNotification = {
      requestId,
      type,
      timestamp: new Date().toISOString(),
    };
    
    const stored = localStorage.getItem(`photo-notifications-${user.id}`);
    const existing: PhotoNotification[] = stored ? JSON.parse(stored) : [];
    
    // Avoid duplicates
    const filtered = existing.filter(n => !(n.requestId === requestId && n.type === type));
    const updated = [...filtered, newNotification];
    
    localStorage.setItem(`photo-notifications-${user.id}`, JSON.stringify(updated));
    setNotifications(updated);
    
    if (type === 'photos_uploaded') {
      setHasNewPhotos(true);
    } else if (type === 'photos_requested') {
      setHasPhotoRequests(true);
    }
  };

  const clearNotification = (requestId: string, type?: PhotoNotification['type']) => {
    if (!user) return;
    
    const stored = localStorage.getItem(`photo-notifications-${user.id}`);
    const existing: PhotoNotification[] = stored ? JSON.parse(stored) : [];
    
    const filtered = type 
      ? existing.filter(n => !(n.requestId === requestId && n.type === type))
      : existing.filter(n => n.requestId !== requestId);
    
    localStorage.setItem(`photo-notifications-${user.id}`, JSON.stringify(filtered));
    setNotifications(filtered);
    
    // Update flags
    setHasNewPhotos(filtered.some(n => n.type === 'photos_uploaded'));
    setHasPhotoRequests(filtered.some(n => n.type === 'photos_requested'));
  };

  const clearAllNotifications = () => {
    if (!user) return;
    
    localStorage.removeItem(`photo-notifications-${user.id}`);
    setNotifications([]);
    setHasNewPhotos(false);
    setHasPhotoRequests(false);
  };

  const getNotificationsForRequest = (requestId: string) => {
    return notifications.filter(n => n.requestId === requestId);
  };

  return {
    notifications,
    hasNewPhotos,
    hasPhotoRequests,
    addNotification,
    clearNotification,
    clearAllNotifications,
    getNotificationsForRequest,
  };
}
