import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Eye, Building2 } from 'lucide-react';

interface Supplier {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: string;
  product_categories: string[];
  total_orders: number;
  acceptance_rate: number;
  stripe_onboarding_complete: boolean;
  created_at: string;
}

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({ title: 'Error', description: 'Failed to load suppliers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (supplier: Supplier, action: 'approve' | 'reject') => {
    setSelectedSupplier(supplier);
    setActionType(action);
    setVerificationNotes('');
    setShowDialog(true);
  };

  const handleVerification = async () => {
    if (!selectedSupplier || !actionType) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('suppliers')
        .update({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          verification_notes: verificationNotes,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      // Send email notification to supplier
      try {
        await supabase.functions.invoke('send-supplier-notification', {
          body: {
            supplierEmail: selectedSupplier.email,
            supplierName: selectedSupplier.contact_name,
            status: actionType === 'approve' ? 'approved' : 'rejected',
            notes: verificationNotes,
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the entire operation if email fails
      }

      toast({ 
        title: 'Success', 
        description: `Supplier ${actionType === 'approve' ? 'approved' : 'rejected'} successfully. Email notification sent.` 
      });
      
      setShowDialog(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      suspended: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return <div>Loading suppliers...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription>
                Review and manage supplier applications and accounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Acceptance</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.business_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{supplier.contact_name}</div>
                        <div className="text-muted-foreground">{supplier.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city}, {supplier.state}
                    </TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell>{supplier.total_orders}</TableCell>
                    <TableCell>{supplier.acceptance_rate.toFixed(1)}%</TableCell>
                    <TableCell>
                      {supplier.stripe_onboarding_complete ? (
                        <Badge variant="default">Connected</Badge>
                      ) : (
                        <Badge variant="outline">Not Connected</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {supplier.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(supplier, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(supplier, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {supplier.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowDialog(true);
                              setActionType(null);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Supplier'}
              {actionType === 'reject' && 'Reject Supplier'}
              {!actionType && 'Supplier Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier?.business_name}
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <p className="text-sm">{selectedSupplier.contact_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedSupplier.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedSupplier.phone}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSupplier.status)}</div>
                </div>
              </div>

              <div>
                <Label>Product Categories</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedSupplier.product_categories.map((cat) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>

              {actionType && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Verification Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this verification decision..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          {actionType && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerification}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {actionType === 'approve' ? 'Approve Supplier' : 'Reject Supplier'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
