import { useEffect } from 'react';

interface UseAppointmentUpdatesProps {
  userId: string | undefined;
  onUpdate: () => void;
}

export const useAppointmentUpdates = ({ userId, onUpdate }: UseAppointmentUpdatesProps) => {
  useEffect(() => {
    // Stub - database tables not configured
  }, [userId, onUpdate]);
};

export default useAppointmentUpdates;
