import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  sku: string;
  part_name: string;
  price: number;
  category: string;
  images: string[] | null;
  created_at: string;
}

export default function AdminProductList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [platformSupplierId, setPlatformSupplierId] = useState<string | null>(null);

  // Load platform supplier
  useEffect(() => {
    fetchPlatformSupplier();
  }, []);

  // Load products after supplier ID is known
  useEffect(() => {
    if (platformSupplierId) fetchProducts();
  }, [platformSupplierId]);

  const fetchPlatformSupplier = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id")
        .eq("is_platform_seller", true)
        .maybeSingle();

      if (error) throw error;

      if (data) setPlatformSupplierId(data.id);
    } catch (error) {
      console.error("Error loading supplier:", error);
      toast({
        title: "Error",
        description: "Failed to load platform supplier.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("supplier_products")
        .select("id, sku, part_name, price, category, images, created_at")
        .eq("supplier_id", platformSupplierId!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      const { error } = await supabase.from("supplier_products").delete().eq("id", deleteProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });

      fetchProducts();
      setDeleteProduct(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase();
    return (
      product.part_name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Platform Products</h1>

        <Button onClick={() => navigate("/admin/add-product")}>Add Product</Button>
      </div>

      <Input
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-6"
      />

      {loading ? (
        <p>Loading...</p>
      ) : filteredProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4">
              <CardContent className="flex items-center justify-between gap-4">
                {/* IMAGE */}
                <img
                  src={product.images?.[0] ? product.images[0] + "?width=160" : "/no-image.png"}
                  alt={product.part_name}
                  className="w-20 h-20 rounded object-cover border"
                />

                {/* PRODUCT INFO */}
                <div className="flex-1">
                  <p className="font-semibold">{product.part_name}</p>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                  <p className="font-medium">${product.price}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/admin/edit-product/${product.id}`)}>
                    Edit
                  </Button>

                  <Button variant="destructive" onClick={() => setDeleteProduct(product)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deleteProduct && (
        <div className="mt-4 flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            Confirm Delete: {deleteProduct.part_name}
          </Button>
          <Button variant="outline" onClick={() => setDeleteProduct(null)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
