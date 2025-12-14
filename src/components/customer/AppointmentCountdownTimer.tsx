import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface AppointmentCountdownTimerProps {
  expiresAt: string;
  onExpired: () => void;
}

export const AppointmentCountdownTimer = ({ expiresAt, onExpired }: AppointmentCountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        onExpired();
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Mark as urgent if less than 5 minutes remaining
      setIsUrgent(minutes < 5);

      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (isExpired) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Appointment Expired</strong>
          <p className="mt-1">The mechanic did not confirm within the required time. Please select another quote.</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`} />
        <span className={`font-semibold ${isUrgent ? 'text-red-800' : 'text-yellow-800'}`}>
          Confirmation Timer
        </span>
        <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="ml-auto">
          {timeRemaining}
        </Badge>
      </div>
      <p className={`text-sm ${isUrgent ? 'text-red-700' : 'text-yellow-700'}`}>
        {isUrgent 
          ? '⚠️ Urgent: The mechanic must confirm and pay the referral fee before this timer expires, or you can select another quote.'
          : 'The mechanic is reviewing your request and will confirm shortly. If they don\'t confirm in time, you can select another quote.'
        }
      </p>
    </div>
  );
};
