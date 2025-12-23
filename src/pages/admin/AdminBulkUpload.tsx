import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import Papa from 'papaparse';

interface ProductRow {
  sku: string;
  part_name: string;
  condition: string;
  warranty_months: number;
  price: number;
  quantity: number;
  category: string;
  image_url?: string;
  description?: string;
}

export default function AdminBulkUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [platformSupplierId, setPlatformSupplierId] = useState<string | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(true);

  useEffect(() => {
    fetchPlatformSupplier();
  }, []);

  const fetchPlatformSupplier = async () => {
    setSupplierLoading(true);
    try {
      console.log('Fetching platform supplier...');
      
      // Fetch existing platform supplier
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, business_name')
        .eq('is_platform_seller', true)
        .order('created_at', { ascending: true })
        .limit(1);

      console.log('Platform supplier query result:', { data, error });

      if (error) {
        console.error('Error querying suppliers:', error);
        throw error;
      }
      
      // If platform supplier exists, use it
      if (data && data.length > 0) {
        setPlatformSupplierId(data[0].id);
        console.log('Platform supplier found:', data[0]);
        return;
      }
      
      // If no platform supplier found, show error - must be created via SQL
      console.log('No platform supplier found');
      toast({
        title: 'Setup Required',
        description: 'Platform supplier not found. Please run the SQL script from fix-platform-supplier.sql in your Supabase SQL editor.',
        variant: 'destructive',
      });
      
    } catch (error: any) {
      console.error('Error in fetchPlatformSupplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize platform supplier',
        variant: 'destructive',
      });
    } finally {
      setSupplierLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['sku', 'part_name', 'condition', 'warranty_months', 'price', 'quantity', 'category', 'image_url', 'description'],
      ['ALT-12345', 'Premium Alternator', 'new', '24', '199.99', '10', 'Alternators', 'https://example.com/image.jpg', 'High-quality alternator']
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doneez_product_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv'];
      const isValidType = validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv');
      
      if (!isValidType) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    console.log('Upload initiated', { 
      hasFile: !!file, 
      fileName: file?.name,
      platformSupplierId,
      supplierLoading 
    });
    
    if (!file) {
      console.error('No file selected');
      toast({
        title: 'Error',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }
    
    if (!platformSupplierId) {
      console.error('No platform supplier ID');
      toast({
        title: 'Error',
        description: 'Platform supplier not initialized. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('Starting CSV parse...');

    Papa.parse<ProductRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('CSV parsed successfully', { rowCount: results.data.length });
        
        const errors: string[] = [];
        const products = results.data
          .map((row, index) => {
            // Validate required fields
            if (!row.sku || !row.part_name || !row.category || !row.price || !row.quantity) {
              errors.push(`Row ${index + 2}: Missing required fields (sku, part_name, category, price, quantity)`);
              return null;
            }

            // Validate numeric fields
            const price = Number(row.price);
            const quantity = Number(row.quantity);
            const warrantyMonths = Number(row.warranty_months) || 12;

            if (isNaN(price) || price <= 0) {
              errors.push(`Row ${index + 2}: Invalid price value`);
              return null;
            }

            if (isNaN(quantity) || quantity < 0) {
              errors.push(`Row ${index + 2}: Invalid quantity value`);
              return null;
            }

            return {
              supplier_id: platformSupplierId,
              sku: row.sku.trim(),
              part_name: row.part_name.trim(),
              condition: row.condition?.toLowerCase() || 'new',
              warranty_months: warrantyMonths,
              price: price,
              quantity: quantity,
              category: row.category.trim(),
              image_url: row.image_url?.trim() || null,
              description: row.description?.trim() || null,
              admin_approved: true,
              is_active: true,
            };
          })
          .filter(Boolean);

        console.log('Products validated', { validCount: products.length, errorCount: errors.length });

        if (errors.length > 0) {
          console.error('Validation errors:', errors);
          toast({
            title: 'Validation Errors',
            description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n...and ${errors.length - 3} more errors` : ''),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        if (products.length === 0) {
          toast({
            title: 'Error',
            description: 'No valid products found in CSV file',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        try {
          console.log('Inserting products into database...', { count: products.length });
          
          const { data, error } = await supabase
            .from('supplier_products')
            .insert(products)
            .select();

          if (error) {
            console.error('Database insertion error:', error);
            throw error;
          }

          console.log('Products uploaded successfully:', data);

          toast({
            title: 'Success',
            description: `Successfully uploaded ${products.length} products`,
          });

          // Reset form
          setFile(null);
          
          // Navigate to products page after short delay
          setTimeout(() => {
            navigate('/admin/products');
          }, 1500);
          
        } catch (error: any) {
          console.error('Error uploading products:', error);
          toast({
            title: 'Upload Failed',
            description: error.message || 'Failed to upload products to database',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: 'Parse Error',
          description: 'Failed to parse CSV file. Please check the file format.',
          variant: 'destructive',
        });
        setLoading(false);
      },
    });
  };

  return (
    <RoleGuard allowedRoles={['admin']} redirectTo="/">
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/doneez/products')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Upload Products
              </CardTitle>
              <CardDescription>
                Upload multiple DoneEZ products at once using a CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Step 1: Download Template</h3>
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 2: Fill in Product Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Fill in the CSV template with your product information. Required fields: SKU, Part Name, Category, Price, Quantity
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 3: Upload CSV File</h3>
                  <div className="flex gap-4 items-center">
                    <input
                      type="file"
                      accept=".csv,text/csv,application/vnd.ms-excel,application/csv"
                      onChange={handleFileChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  {file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleUpload} disabled={!file || loading || supplierLoading || !platformSupplierId}>
                  <Upload className="mr-2 h-4 w-4" />
                  {supplierLoading ? 'Initializing...' : loading ? 'Uploading...' : 'Upload Products'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/products')}>
                  Cancel
                </Button>
              </div>
              
              {supplierLoading && (
                <p className="text-sm text-muted-foreground">
                  Initializing platform supplier...
                </p>
              )}
              
              {!supplierLoading && !platformSupplierId && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive font-semibold">
                    Platform supplier not found. Please run the database migrations or contact support.
                  </p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">CSV Format Guidelines:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>First row must contain column headers</li>
                  <li>Required columns: sku, part_name, category, price, quantity</li>
                  <li>Optional columns: condition, warranty_months, image_url, description</li>
                  <li>Price should be in USD (e.g., 199.99)</li>
                  <li>Quantity must be a whole number</li>
                  <li>Condition options: new, refurbished, used</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
