import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Phone, Mail, Car, Clock, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  starts_at: string;
  notes?: string;
  status: string;
  pro_id: string;
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
      // Fetch service requests with paid referral fees (confirmed jobs)
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_requests')
        .select(`
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
          ),
          referral_fees!inner (
            status,
            paid_at
          ),
          appointments (
            id,
            starts_at,
            notes,
            status,
            pro_id,
            profiles (
              name
            )
          )
        `)
        .eq('customer_id', user?.id)
        .eq('referral_fees.status', 'paid')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching appointments:', requestsError);
        toast({
          title: "Error",
          description: "Failed to fetch appointments",
          variant: "destructive",
        });
        return;
      }

      // Transform to appointment format
      const transformedAppointments = (requestsData || []).map(req => {
        const appointment = req.appointments?.[0];
        return {
          id: appointment?.id || req.id,
          starts_at: appointment?.starts_at || null,
          notes: appointment?.notes,
          status: appointment?.status || 'pending_scheduling',
          pro_id: appointment?.pro_id,
          service_requests: {
            id: req.id,
            vehicle_make: req.vehicle_make,
            model: req.model,
            year: req.year,
            trim: req.trim,
            address: req.address,
            zip: req.zip,
            contact_email: req.contact_email,
            contact_phone: req.contact_phone,
            status: req.status,
            service_categories: req.service_categories
          },
          profiles: appointment?.profiles || { name: 'Professional' }
        };
      });

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async (appointmentId: string, proId: string) => {
    try {
      // Update appointment status to completed
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      // Update service request status to completed
      const appointment = appointments.find(a => a.id === appointmentId);
      if (appointment) {
        const { error: requestError } = await supabase
          .from('service_requests')
          .update({ status: 'completed' })
          .eq('id', appointment.service_requests.id);

        if (requestError) throw requestError;
      }

      // Notify the professional
      const { error: notifyError } = await supabase.functions.invoke('notify-job-completed', {
        body: { appointment_id: appointmentId, pro_id: proId }
      });

      if (notifyError) {
        console.error('Error notifying professional:', notifyError);
      }

      toast({
        title: "Job Completed",
        description: "The professional has been notified. Thank you!",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error completing job:', error);
      toast({
        title: "Error",
        description: "Failed to mark job as completed",
        variant: "destructive",
      });
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

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-muted-foreground">
                            Service Request ID: {appointment.service_requests.id}
                          </div>
                          {appointment.status !== 'completed' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark job as complete?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will notify the professional that the job has been completed. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCompleteJob(appointment.id, appointment.pro_id)}>
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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