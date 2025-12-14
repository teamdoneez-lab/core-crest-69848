interface UseAppointmentUpdatesProps {
  userId: string | undefined;
  onUpdate: () => void;
}

export const useAppointmentUpdates = ({ userId, onUpdate }: UseAppointmentUpdatesProps) => {
  return { appointments: [], isLoading: false };
};

export default useAppointmentUpdates;