interface AppointmentCountdownTimerProps {
  expiresAt: string;
  onExpired: () => void;
}

export const AppointmentCountdownTimer = ({ expiresAt, onExpired }: AppointmentCountdownTimerProps) => {
  return (
    <span className="text-muted-foreground text-sm">Timer coming soon</span>
  );
};

export default AppointmentCountdownTimer;
