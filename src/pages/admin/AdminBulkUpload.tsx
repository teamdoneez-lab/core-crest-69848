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

  useEffect(() => {
    fetchPlatformSupplier();
  }, []);

  const fetchPlatformSupplier = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id')
        .eq('is_platform_seller', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPlatformSupplierId(data.id);
      }
    } catch (error) {
      console.error('Error fetching platform supplier:', error);
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
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !platformSupplierId) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    Papa.parse<ProductRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const errors: string[] = [];
        const products = results.data
          .map((row, index) => {
            // Validate required fields
            if (!row.sku || !row.part_name || !row.category || !row.price || !row.quantity) {
              errors.push(`Row ${index + 2}: Missing required fields`);
              return null;
            }

            return {
              supplier_id: platformSupplierId,
              sku: row.sku,
              part_name: row.part_name,
              condition: row.condition || 'new',
              warranty_months: Number(row.warranty_months) || 12,
              price: Number(row.price),
              quantity: Number(row.quantity),
              category: row.category,
              image_url: row.image_url || null,
              description: row.description || null,
              admin_approved: true,
              is_active: true,
            };
          })
          .filter(Boolean);

        if (errors.length > 0) {
          toast({
            title: 'Validation Errors',
            description: errors.join('\n'),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        try {
          const { error } = await supabase
            .from('supplier_products')
            .insert(products);

          if (error) throw error;

          toast({
            title: 'Success',
            description: `Successfully uploaded ${products.length} products`,
          });

          navigate('/admin/products');
        } catch (error) {
          console.error('Error uploading products:', error);
          toast({
            title: 'Error',
            description: 'Failed to upload products',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse CSV file',
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
            onClick={() => navigate('/admin/products')}
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
                      accept=".csv"
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
                <Button onClick={handleUpload} disabled={!file || loading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? 'Uploading...' : 'Upload Products'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/products')}>
                  Cancel
                </Button>
              </div>

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
