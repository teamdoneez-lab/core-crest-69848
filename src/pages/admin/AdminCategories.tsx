import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RoleGuard } from '@/components/RoleGuard';

// Hardcoded categories for DoneEZ products
const PLATFORM_CATEGORIES = [
  // Parts
  'Alternators',
  'Batteries',
  'Brakes',
  'Engine Parts',
  'Filters',
  'Lights',
  'Suspension',
  'Transmission',
  'Cooling System',
  'Exhaust',
  'Fuel System',
  'Ignition',
  'Electrical',
  'Body Parts',
  'Interior',
  'Tools',
  'Fluids',
  'Accessories',
  // Supplies
  'Shop Supplies',
  'Cleaners & Chemicals',
  'Gloves & PPE',
  'Towels & Wipes',
  'Detailing Supplies',
  'Small Tools & Accessories',
  'Shop Equipment',
  'Adhesives & Sealants',
  'Other',
];

interface Category {
  name: string;
  productCount: number;
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const db = supabase as any;
      
      // Get platform supplier
      const { data: supplier } = await db
        .from('suppliers')
        .select('id')
        .eq('is_platform_seller', true)
        .maybeSingle();

      if (!supplier) return;

      // Get all DoneEZ products and count by category
      const { data: products, error } = await db
        .from('supplier_products')
        .select('category')
        .eq('supplier_id', supplier.id);

      if (error) throw error;

      // Count products per category
      const categoryCounts = PLATFORM_CATEGORIES.map(catName => {
        const count = products?.filter(p => p.category === catName).length || 0;
        return {
          name: catName,
          productCount: count,
        };
      });

      setCategories(categoryCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    // Check if category already exists
    if (PLATFORM_CATEGORIES.includes(newCategoryName)) {
      toast({
        title: 'Error',
        description: 'Category already exists',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Info',
      description: 'Category management is currently using a predefined list. Custom categories coming soon!',
    });

    setShowAddDialog(false);
    setNewCategoryName('');
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;

    if (deleteCategory.productCount > 0) {
      toast({
        title: 'Cannot Delete',
        description: `Cannot delete category "${deleteCategory.name}" because it has ${deleteCategory.productCount} products. Remove all products first.`,
        variant: 'destructive',
      });
      setDeleteCategory(null);
      return;
    }

    toast({
      title: 'Info',
      description: 'Category management is currently using a predefined list. Custom category deletion coming soon!',
    });

    setDeleteCategory(null);
  };

  return (
    <RoleGuard allowedRoles={['admin']} redirectTo="/">
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/doneez/products')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Product Categories</h1>
              <p className="text-muted-foreground">Manage product categories for DoneEZ listings</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories
              </CardTitle>
              <CardDescription>
                Predefined categories for organizing DoneEZ products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.name}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.productCount} products</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCategory(category)}
                              disabled={category.productCount > 0}
                            >
                              <Trash2 className={`h-4 w-4 ${category.productCount > 0 ? 'text-muted-foreground' : 'text-destructive'}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Category Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new product category for DoneEZ listings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Tires"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Modify category details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={editCategory?.name || ''} disabled />
                <p className="text-sm text-muted-foreground">
                  Category editing is currently limited. Custom categories coming soon!
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setEditCategory(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Dialog */}
        <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteCategory?.productCount === 0 
                  ? `Are you sure you want to delete the category "${deleteCategory?.name}"?`
                  : `Cannot delete "${deleteCategory?.name}" because it has ${deleteCategory?.productCount} products. Remove all products from this category first.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {deleteCategory?.productCount === 0 && (
                <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  );
}
