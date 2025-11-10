import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAppointmentUpdatesProps {
  userId: string | undefined;
  onUpdate: () => void;
}

export const useAppointmentUpdates = ({ userId, onUpdate }: UseAppointmentUpdatesProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to appointment status changes
    const channel = supabase
      .channel('appointment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          console.log('Appointment update:', payload);
          
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;

          if (newStatus !== oldStatus) {
            // Show toast notification based on status
            if (newStatus === 'confirmed') {
              toast({
                title: "✅ Appointment Confirmed",
                description: "The mechanic has confirmed your appointment!",
              });
            } else if (newStatus === 'expired') {
              toast({
                title: "⏰ Appointment Expired",
                description: "Please select another quote from your dashboard.",
                variant: "destructive",
              });
            } else if (newStatus === 'declined') {
              toast({
                title: "Appointment Declined",
                description: "The mechanic declined. Please select another quote.",
                variant: "destructive",
              });
            } else if (newStatus === 'completed') {
              toast({
                title: "✅ Job Complete",
                description: "The job has been marked as complete.",
              });
            }

            // Trigger refresh
            onUpdate();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate, toast]);
};
