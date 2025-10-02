import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QuoteForm } from '@/components/pro/QuoteForm';
import { Clock, MapPin, Calendar as CalendarIcon, User, Phone, Mail, Car, CheckCircle, PlayCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ServiceRequest {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  address: string;
  zip: string;
  contact_email: string;
  contact_phone: string;
  appointment_pref: string;
  notes?: string;
  status: string;
  accepted_pro_id?: string;
  accept_expires_at?: string;
  service_categories: {
    name: string;
  };
  appointments?: {
    id: string;
    starts_at: string;
    notes?: string;
  };
}

interface Lead {
  id: string;
  status: 'new' | 'accepted' | 'declined';
  created_at: string;
  service_requests: ServiceRequest;
}

interface AppointmentScheduleProps {
  lead: Lead;
  onScheduled: () => void;
}

interface CountdownTimerProps {
  expiresAt: string;
}

const AppointmentSchedule = ({ lead, onScheduled }: AppointmentScheduleProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!date) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = time.split(':');
      const appointmentTime = new Date(date);
      appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data, error } = await supabase.rpc('schedule_appointment', {
        request_id: lead.service_requests.id,
        appointment_time: appointmentTime.toISOString(),
        appointment_notes: notes || null
      });

      if (error) {
        console.error('Error scheduling appointment:', error);
        toast({
          title: 'Error',
          description: 'Failed to schedule appointment',
          variant: 'destructive'
        });
        return;
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!result.success) {
        toast({
          title: 'Cannot Schedule',
          description: result.error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Appointment Scheduled!',
        description: `Appointment set for ${format(appointmentTime, 'PPP p')}`
      });

      setOpen(false);
      onScheduled();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Set up an appointment for {lead.service_requests.service_categories.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for the appointment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CountdownTimer = ({ expiresAt }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const distance = expiry - now;

      if (distance > 0) {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Expired');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
      <Clock className="h-4 w-4" />
      {timeLeft}
    </div>
  );
};

const ProInbox = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isPro) {
      fetchLeads();
    }
  }, [user, isPro]);

  // Handle payment success callback from Stripe
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (payment === 'success' && sessionId) {
      verifyQuotePayment(sessionId);
      // Clean up URL parameters
      window.history.replaceState({}, '', '/pro-inbox');
    } else if (payment === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Quote submission was cancelled. No charges were made.",
      });
      // Clean up URL parameters
      window.history.replaceState({}, '', '/pro-inbox');
    }
  }, []);

  const verifyQuotePayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-quote-payment", {
        body: { session_id: sessionId },
      });

      if (error) throw error;

      toast({
        title: "Quote Submitted Successfully",
        description: "Your quote has been sent to the customer via email",
      });

      // Refresh leads to show updated data
      fetchLeads();
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Error",
        description: "Payment was successful but there was an issue completing the quote. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Redirect if not authenticated or not a pro
  if (!authLoading && !roleLoading && (!user || !isPro)) {
    return <Navigate to="/" replace />;
  }

  const fetchLeads = async () => {
    try {
      // First, fetch leads with basic info (masked data)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          status,
          created_at,
          request_id
        `)
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        toast({
          title: "Error",
          description: "Failed to fetch leads",
          variant: "destructive",
        });
        return;
      }

      // Fetch full details for each request using the secure function
      const leadsWithDetails = await Promise.all(
        (leadsData || []).map(async (lead) => {
          const { data: requestDetails, error: detailsError } = await supabase
            .rpc('get_service_request_details', { request_id: lead.request_id })
            .single();

          if (detailsError) {
            console.error('Error fetching request details:', detailsError);
            return null;
          }

          // Fetch category and appointment info
          const { data: category } = await supabase
            .from('service_categories')
            .select('name')
            .eq('id', requestDetails.category_id)
            .single();

          const { data: appointment } = await supabase
            .from('appointments')
            .select('id, starts_at, notes')
            .eq('request_id', requestDetails.id)
            .maybeSingle();

          return {
            ...lead,
            service_requests: {
              ...requestDetails,
              service_categories: category,
              appointments: appointment ? appointment : undefined
            }
          };
        })
      );

      // Filter out any null results from errors
      setLeads(leadsWithDetails.filter(lead => lead !== null) as Lead[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLead = async (leadId: string, requestId: string) => {
    try {
      // First, create Stripe checkout session for referral fee
      toast({
        title: 'Processing...',
        description: 'Creating payment session for referral fee'
      });

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-referral-checkout', {
        body: { 
          lead_id: leadId,
          request_id: requestId
        }
      });

      if (checkoutError) {
        console.error('Error creating checkout:', checkoutError);
        toast({
          title: 'Error',
          description: 'Failed to create payment session',
          variant: 'destructive'
        });
        return;
      }

      if (checkoutData.error) {
        toast({
          title: 'Error',
          description: checkoutData.error,
          variant: 'destructive'
        });
        return;
      }

      // Redirect to Stripe Checkout
      if (checkoutData.url) {
        toast({
          title: 'Redirecting to Payment',
          description: 'Opening Stripe Checkout in new tab'
        });
        
        // Store session info for verification
        sessionStorage.setItem('pending_checkout', JSON.stringify({
          session_id: checkoutData.session_id,
          request_id: requestId,
          lead_id: leadId
        }));

        window.open(checkoutData.url, '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase.rpc('update_request_status', {
        request_id: requestId,
        new_status: newStatus
      });

      if (error) {
        console.error('Error updating status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update status',
          variant: 'destructive'
        });
        return;
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!result.success) {
        toast({
          title: 'Cannot Update',
          description: result.error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Status Updated!',
        description: `Status changed to ${newStatus.replace('_', ' ')}`
      });

      fetchLeads();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const updateLeadStatus = async (leadId: string, status: 'declined') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status } : lead
      ));

      toast({
        title: "Success",
        description: `Lead declined successfully`,
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (lead: Lead) => {
    if (lead.status === 'accepted') return 'bg-green-100 text-green-800';
    if (lead.status === 'declined') return 'bg-red-100 text-red-800';
    
    // Check if job is locked by someone else
    const request = lead.service_requests;
    if (request.accepted_pro_id && request.accept_expires_at) {
      const isExpired = new Date(request.accept_expires_at) <= new Date();
      if (!isExpired && request.accepted_pro_id !== user?.id) {
        return 'bg-gray-100 text-gray-800';
      }
    }
    
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (lead: Lead) => {
    if (lead.status === 'accepted') return 'Accepted';
    if (lead.status === 'declined') return 'Declined';
    
    // Check if job is locked by someone else
    const request = lead.service_requests;
    if (request.accepted_pro_id && request.accept_expires_at) {
      const isExpired = new Date(request.accept_expires_at) <= new Date();
      if (!isExpired && request.accepted_pro_id !== user?.id) {
        return 'Locked';
      }
    }
    
    return 'Available';
  };

  const canAcceptLead = (lead: Lead) => {
    if (lead.status !== 'new') return false;
    
    const request = lead.service_requests;
    if (request.accepted_pro_id && request.accept_expires_at) {
      const isExpired = new Date(request.accept_expires_at) <= new Date();
      return isExpired;
    }
    
    return true;
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lead Inbox</h1>
          <p className="text-muted-foreground">
            Manage your service request leads and appointments
          </p>
        </div>

        {leads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No leads available at the moment. Make sure your profile is complete and verified.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const request = lead.service_requests;
              const isLocked = request.accepted_pro_id && request.accept_expires_at && new Date(request.accept_expires_at) > new Date();
              const isMyLock = request.accepted_pro_id === user?.id;
              
              return (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {request.service_categories.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Car className="h-4 w-4" />
                          {request.year} {request.vehicle_make} {request.model}
                          {request.trim && ` ${request.trim}`}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(lead)}>
                          {getStatusText(lead)}
                        </Badge>
                        {request.status !== 'pending' && (
                          <Badge className={getRequestStatusColor(request.status)}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                        {isLocked && request.accept_expires_at && (
                          <CountdownTimer expiresAt={request.accept_expires_at} />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ZIP: {request.zip}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.contact_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.contact_phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Appointment Preference
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {request.appointment_pref}
                      </p>
                    </div>

                    {request.mileage && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Vehicle Mileage
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.mileage.toLocaleString()} miles
                        </p>
                      </div>
                    )}

                    {request.notes && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {request.appointments && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Scheduled Appointment
                        </h4>
                        <p className="text-sm text-blue-700">
                          {format(new Date(request.appointments.starts_at), 'PPP p')}
                        </p>
                        {request.appointments.notes && (
                          <p className="text-sm text-blue-600 mt-1">
                            {request.appointments.notes}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {canAcceptLead(lead) && lead.status === 'new' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                              Submit Quote
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submit Your Quote</DialogTitle>
                              <DialogDescription>
                                Provide an estimated price and service description for this request.
                              </DialogDescription>
                            </DialogHeader>
                            <QuoteForm 
                              requestId={request.id}
                              onSuccess={() => {
                                fetchLeads();
                                toast({
                                  title: "Quote Submitted",
                                  description: "The customer will review your quote",
                                });
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {lead.status === 'accepted' && isMyLock && (
                        <>
                          {/* Show payment button if quote accepted but fee not paid */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="bg-blue-600 hover:bg-blue-700">
                                Pay Referral Fee & Schedule
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Pay Referral Fee</DialogTitle>
                                <DialogDescription>
                                  Complete the referral fee payment to schedule your appointment
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  Once payment is confirmed, you'll be able to schedule the appointment with the customer.
                                </p>
                                <Button 
                                  onClick={async () => {
                                    // Get quote for this request
                                    const { data: quotes } = await supabase
                                      .from('quotes')
                                      .select('id')
                                      .eq('request_id', request.id)
                                      .eq('status', 'accepted')
                                      .single();

                                    if (quotes) {
                                      const { data, error } = await supabase.functions.invoke('create-referral-checkout', {
                                        body: { quote_id: quotes.id }
                                      });

                                      if (error || data.error) {
                                        toast({
                                          title: 'Error',
                                          description: error?.message || data.error,
                                          variant: 'destructive'
                                        });
                                      } else {
                                        window.open(data.url, '_blank');
                                      }
                                    }
                                  }}
                                  className="w-full"
                                >
                                  Proceed to Payment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      
                      {request.status === 'scheduled' && isMyLock && (
                        <>
                          <Button 
                            onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Work
                          </Button>
                          <AppointmentSchedule lead={lead} onScheduled={fetchLeads} />
                        </>
                      )}
                      
                      {request.status === 'in_progress' && isMyLock && (
                        <Button 
                          onClick={() => handleStatusUpdate(request.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}

                      {lead.status === 'new' && !canAcceptLead(lead) && (
                        <Button disabled className="opacity-50">
                          {isMyLock ? 'Job Locked by You' : 'Locked by Another Pro'}
                        </Button>
                      )}
                      
                      {lead.status === 'new' && (
                        <Button 
                          variant="outline"
                          onClick={() => updateLeadStatus(lead.id, 'declined')}
                        >
                          Decline
                        </Button>
                      )}
                      
                      {(request.status === 'scheduled' || request.status === 'in_progress') && isMyLock && (
                        <Button 
                          variant="outline"
                          onClick={() => handleStatusUpdate(request.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      Received: {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProInbox;