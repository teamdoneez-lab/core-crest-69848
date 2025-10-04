import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Download, ExternalLink, CheckCircle, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralFee {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  refundable?: boolean;
  service_requests: {
    id: string;
    vehicle_make: string;
    model: string;
    year: number;
  } | null;
  profiles: {
    name: string;
  } | null;
}

export const ReferralFeesTab = () => {
  const [fees, setFees] = useState<ReferralFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('paid');
  const [currentPage, setCurrentPage] = useState(1);
  const feesPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('referral_fees')
      .select(`
        *,
        service_requests (id, vehicle_make, model, year),
        profiles (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referral fees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral fees',
        variant: 'destructive'
      });
    } else {
      setFees(data || []);
    }
    setLoading(false);
  };

  const handleMarkPaid = async (feeId: string, paymentMethod: string) => {
    try {
      const { error } = await supabase
        .from('referral_fees')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', feeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Fee marked as paid'
      });

      fetchFees();
    } catch (error) {
      console.error('Error marking fee as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark fee as paid',
        variant: 'destructive'
      });
    }
  };

  const handleRefund = async (feeId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('refund-referral-fee', {
        body: { referral_fee_id: feeId }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data.error);
      }

      toast({
        title: 'Success',
        description: 'Referral fee refunded successfully'
      });

      fetchFees();
    } catch (error) {
      console.error('Error refunding fee:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to refund fee',
        variant: 'destructive'
      });
    }
  };

  const exportToCSV = () => {
    const csvData = fees.map(fee => ({
      'Pro Name': fee.profiles?.name || 'N/A',
      'Vehicle': fee.service_requests 
        ? `${fee.service_requests.year} ${fee.service_requests.vehicle_make} ${fee.service_requests.model}`
        : 'N/A',
      'Amount': `$${fee.amount.toFixed(2)}`,
      'Status': fee.status,
      'Created': format(new Date(fee.created_at), 'yyyy-MM-dd HH:mm'),
      'Paid Date': fee.paid_at ? format(new Date(fee.paid_at), 'yyyy-MM-dd HH:mm') : 'N/A',
      'Stripe Session': fee.stripe_session_id || 'N/A'
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `referral_fees_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const filteredFees = statusFilter === 'all' 
    ? fees 
    : fees.filter(fee => fee.status === statusFilter);

  // Pagination
  const totalPages = Math.ceil(filteredFees.length / feesPerPage);
  const startIndex = (currentPage - 1) * feesPerPage;
  const endIndex = startIndex + feesPerPage;
  const paginatedFees = filteredFees.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'owed': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading referral fees...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {/* <SelectItem value="owed">Owed</SelectItem> */}
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Fees List */}
      <div className="space-y-4">
        {paginatedFees.map((fee) => (
          <Card key={fee.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{fee.profiles?.name || 'Unknown Pro'}</span>
                    <Badge className={getStatusColor(fee.status)}>
                      {fee.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Vehicle: {fee.service_requests 
                      ? `${fee.service_requests.year} ${fee.service_requests.vehicle_make} ${fee.service_requests.model}`
                      : 'N/A'}
                  </div>

                  <div className="text-sm">
                    Amount: <span className="font-semibold">${fee.amount.toFixed(2)}</span>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Request ID:</span>{' '}
                    <span className="font-mono text-xs">{fee.service_requests?.id || 'N/A'}</span>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Date:</span>{' '}
                    {fee.paid_at ? format(new Date(fee.paid_at), 'PPP p') : format(new Date(fee.created_at), 'PPP p')}
                  </div>

                  {fee.stripe_payment_intent && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Transaction ID:</span>{' '}
                      <span className="font-mono text-xs">{fee.stripe_payment_intent}</span>
                    </div>
                  )}

                  {fee.stripe_session_id && (
                    <a 
                      href={`https://dashboard.stripe.com/test/payments/${fee.stripe_payment_intent}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      View in Stripe <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                

                {fee.status === 'paid' && fee.refundable && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Refund
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Refund Referral Fee</DialogTitle>
                        <DialogDescription>
                          This will refund the referral fee via Stripe. This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          Amount to refund: <span className="font-semibold">${fee.amount.toFixed(2)}</span>
                        </p>
                        <p className="text-sm text-yellow-600">
                          ⚠️ This is typically done when the customer declines after an inspection.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {}}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleRefund(fee.id)}
                        >
                          Confirm Refund
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFees.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No fees found
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
