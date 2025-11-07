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
import { Calendar, MapPin, Phone, Mail, Car, Clock, User, CheckCircle, Trash2, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ChatBox } from '@/components/chat/ChatBox';
import { ReviewModal } from '@/components/customer/ReviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    accepted_pro_id?: string;
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: string; proId: string; proName: string } | null>(null);
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
      console.log('[APPOINTMENTS] Starting fetch...');
      
      // First, get all in_progress and completed service requests
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
          accepted_pro_id,
          service_categories (
            name
          )
        `)
        .eq('customer_id', user?.id)
        .in('status', ['in_progress', 'completed'])
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('[APPOINTMENTS] Error fetching requests:', requestsError);
        toast({
          title: "Error",
          description: "Failed to fetch appointments",
          variant: "destructive",
        });
        return;
      }

      console.log('[APPOINTMENTS] Requests data:', requestsData);

      if (!requestsData || requestsData.length === 0) {
        console.log('[APPOINTMENTS] No in_progress requests found');
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Get referral fees for these requests
      const requestIds = requestsData.map(r => r.id);
      console.log('[APPOINTMENTS] Fetching fees for request IDs:', requestIds);
      
      const { data: feesData, error: feesError } = await supabase
        .from('referral_fees')
        .select('request_id, status, paid_at')
        .in('request_id', requestIds)
        .eq('status', 'paid');

      if (feesError) {
        console.error('[APPOINTMENTS] Error fetching fees:', feesError);
      }
      
      console.log('[APPOINTMENTS] Fees data:', feesData);

      // Get appointments for these requests
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          request_id,
          starts_at,
          notes,
          status,
          pro_id,
          profiles (
            name
          )
        `)
        .in('request_id', requestIds);

      if (appointmentsError) {
        console.error('[APPOINTMENTS] Error fetching appointments:', appointmentsError);
      }
      
      console.log('[APPOINTMENTS] Appointments data:', appointmentsData);

      // Create maps for easy lookup
      const feesMap = new Map(feesData?.map(f => [f.request_id, f]) || []);
      const appointmentsMap = new Map(appointmentsData?.map(a => [a.request_id, a]) || []);

      console.log('[APPOINTMENTS] Fees map size:', feesMap.size);
      console.log('[APPOINTMENTS] Appointments map size:', appointmentsMap.size);

      // Filter and transform - only include requests with paid fees
      const transformedAppointments = requestsData
        .filter(req => {
          const hasPaidFee = feesMap.has(req.id);
          console.log(`[APPOINTMENTS] Request ${req.id} has paid fee:`, hasPaidFee);
          return hasPaidFee;
        })
        .map(req => {
          const appointment = appointmentsMap.get(req.id);
          console.log(`[APPOINTMENTS] Mapping request ${req.id}, appointment:`, appointment);
          return {
            id: appointment?.id || req.id,
            starts_at: appointment?.starts_at || null,
            notes: appointment?.notes,
            status: appointment?.status || 'pending_scheduling',
            pro_id: appointment?.pro_id || req.accepted_pro_id,
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
              accepted_pro_id: req.accepted_pro_id,
              service_categories: req.service_categories
            },
            profiles: appointment?.profiles || { name: 'Professional' }
          };
        });

      console.log('[APPOINTMENTS] Final transformed appointments:', transformedAppointments);
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('[APPOINTMENTS] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async (appointmentId: string, proId: string, proName: string) => {
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

      // Open review modal
      setSelectedAppointment({ id: appointmentId, proId, proName });
      setReviewModalOpen(true);

      toast({
        title: "Job Completed",
        description: "Please leave a review for the professional",
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

  const handleDeleteAppointment = async (appointmentId: string, requestId: string) => {
    try {
      // Delete the appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      // Mark service request as cancelled so it won't appear again
      const { error: requestError } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      toast({
        title: "Appointment Deleted",
        description: "The appointment has been removed from your history.",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment",
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

  const upcomingAppointments = appointments.filter(apt => 
    apt.starts_at && 
    isUpcoming(apt.starts_at) && 
    apt.service_requests.status !== 'completed'
  );
  const pastAppointments = appointments.filter(apt => 
    apt.starts_at && 
    !isUpcoming(apt.starts_at) && 
    apt.service_requests.status !== 'completed'
  );
  const pendingScheduling = appointments.filter(apt => 
    !apt.starts_at && 
    apt.service_requests.status !== 'completed'
  );
  const completedAppointments = appointments.filter(apt => 
    apt.service_requests.status === 'completed'
  );

  return (
    <>
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
            {pendingScheduling.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Pending Scheduling</h2>
                <div className="space-y-4">
                  {pendingScheduling.map((appointment) => (
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
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            The professional will schedule an appointment time with you soon.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Professional
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {appointment.profiles.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t mt-4">
                          <div className="text-xs text-muted-foreground">
                            Service Request ID: {appointment.service_requests.id}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Chat with Pro
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Chat with {appointment.profiles.name}</DialogTitle>
                                </DialogHeader>
                                <ChatBox 
                                  requestId={appointment.service_requests.id} 
                                  otherUserName={appointment.profiles.name} 
                                />
                              </DialogContent>
                            </Dialog>
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
                                    <AlertDialogAction onClick={() => handleCompleteJob(appointment.id, appointment.pro_id, appointment.profiles.name)}>
                                      Confirm
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

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
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Chat with Pro
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Chat with {appointment.profiles.name}</DialogTitle>
                                </DialogHeader>
                                <ChatBox 
                                  requestId={appointment.service_requests.id} 
                                  otherUserName={appointment.profiles.name} 
                                />
                              </DialogContent>
                            </Dialog>
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
                                  <AlertDialogAction onClick={() => handleCompleteJob(appointment.id, appointment.pro_id, appointment.profiles.name)}>
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Completed Appointments</h2>
                <div className="space-y-4">
                  {completedAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-green-200 bg-green-50/30">
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
                          <Badge className="bg-green-100 text-green-800">
                            COMPLETED
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            {appointment.starts_at && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <Clock className="h-4 w-4 inline mr-2" />
                                {format(new Date(appointment.starts_at), 'PPP p')}
                              </p>
                            )}
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

                        <div className="flex items-center justify-between pt-4 border-t mt-4">
                          <div className="text-xs text-muted-foreground">
                            Service Request ID: {appointment.service_requests.id}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Job Completed</span>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove this appointment from your history. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteAppointment(appointment.id, appointment.service_requests.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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

                        <div className="flex items-center justify-between pt-4 border-t mt-4">
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
                                  <AlertDialogAction onClick={() => handleCompleteJob(appointment.id, appointment.pro_id, appointment.profiles.name)}>
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
          </div>
        )}
      </div>
    </div>

    {/* Review Modal */}
    {selectedAppointment && (
      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        appointmentId={selectedAppointment.id}
        proId={selectedAppointment.proId}
        proName={selectedAppointment.proName}
        onReviewSubmitted={() => {
          setReviewModalOpen(false);
          setSelectedAppointment(null);
        }}
      />
    )}
    </>
  );
};

export default Appointments;