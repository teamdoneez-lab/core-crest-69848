import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Phone, Mail, Car, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  starts_at: string;
  notes?: string;
  service_requests: {
    id: string;
    vehicle_make: string;
    model: string;
    year: number;
    trim?: string;
    address: string;
    zip: string;
    contact_email: string;
    contact_phone: string;
    status: string;
    service_categories: {
      name: string;
    };
  };
  profiles: {
    name: string;
  };
}

const Appointments = () => {
  const { user, loading: authLoading } = useAuth();
  const { isCustomer, loading: roleLoading } = useRole();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isCustomer) {
      fetchAppointments();
    }
  }, [user, isCustomer]);

  // Redirect if not authenticated or not a customer
  if (!authLoading && !roleLoading && (!user || !isCustomer)) {
    return <Navigate to="/" replace />;
  }

  const fetchAppointments = async () => {
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          starts_at,
          notes,
          service_requests (
            id,
            vehicle_make,
            model,
            year,
            trim,
            address,
            zip,
            contact_email,
            contact_phone,
            status,
            service_categories (
              name
            )
          ),
          profiles (
            name
          )
        `)
        .order('starts_at', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Failed to fetch appointments",
          variant: "destructive",
        });
        return;
      }

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = (appointmentTime: string) => {
    return new Date(appointmentTime) > new Date();
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => isUpcoming(apt.starts_at));
  const pastAppointments = appointments.filter(apt => !isUpcoming(apt.starts_at));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
          <p className="text-muted-foreground">
            View your scheduled and past appointments
          </p>
        </div>

        {appointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No appointments scheduled yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Upcoming Appointments</h2>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {appointment.service_requests.service_categories.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Car className="h-4 w-4" />
                              {appointment.service_requests.year} {appointment.service_requests.vehicle_make} {appointment.service_requests.model}
                              {appointment.service_requests.trim && ` ${appointment.service_requests.trim}`}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(appointment.service_requests.status)}>
                            {appointment.service_requests.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Appointment Details
                            </h4>
                            <p className="text-sm text-muted-foreground mb-1">
                              <Clock className="h-4 w-4 inline mr-2" />
                              {format(new Date(appointment.starts_at), 'PPP p')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <User className="h-4 w-4 inline mr-2" />
                              Professional: {appointment.profiles.name}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Service Location
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service_requests.address}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ZIP: {appointment.service_requests.zip}
                            </p>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold mb-1">Appointment Notes</h4>
                            <p className="text-sm text-blue-700">{appointment.notes}</p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Service Request ID: {appointment.service_requests.id}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Past Appointments</h2>
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {appointment.service_requests.service_categories.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Car className="h-4 w-4" />
                              {appointment.service_requests.year} {appointment.service_requests.vehicle_make} {appointment.service_requests.model}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(appointment.service_requests.status)}>
                            {appointment.service_requests.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              <Clock className="h-4 w-4 inline mr-2" />
                              {format(new Date(appointment.starts_at), 'PPP p')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <User className="h-4 w-4 inline mr-2" />
                              Professional: {appointment.profiles.name}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 inline mr-2" />
                              {appointment.service_requests.address}, {appointment.service_requests.zip}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;