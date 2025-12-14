import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Papa from "papaparse";

interface ProductRow {
  sku: string;
  part_name: string;
  oem_cross_ref?: string;
  condition: string;
  warranty_months: number;
  price: number;
  quantity: number;
  category: string;
  region?: string;
  image_url?: string;
  description?: string;
}

export default function SupplierProductUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [soldByPlatform, setSoldByPlatform] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [platformSupplierId, setPlatformSupplierId] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      await checkAdminStatus();
      await fetchPlatformSupplier();
    };

    initializeData();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchPlatformSupplier = async () => {
    try {
      // Use the official DoneEZ platform supplier ID
      const DONEEZ_SUPPLIER_ID = "a52d5eb4-0504-482f-b87d-c7aedce36fda";

      // Verify it exists
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, business_name, is_platform_seller")
        .eq("id", DONEEZ_SUPPLIER_ID)
        .maybeSingle();

      if (!error && data) {
        setPlatformSupplierId(DONEEZ_SUPPLIER_ID);
        console.log("Using DoneEZ platform supplier:", DONEEZ_SUPPLIER_ID);
      } else {
        console.error("DoneEZ platform supplier not found");
      }
    } catch (error) {
      console.error("Error fetching DoneEZ platform supplier:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      const validTypes = ["text/csv", "application/vnd.ms-excel", "application/csv"];
      const isValidType = validTypes.includes(selectedFile.type) || selectedFile.name.endsWith(".csv");

      if (!isValidType) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const template = [
      [
        "sku",
        "part_name",
        "oem_cross_ref",
        "condition",
        "warranty_months",
        "price",
        "quantity",
        "category",
        "region",
        "image_url",
        "description",
      ],
      [
        "ALT-12345",
        "Premium Alternator",
        "27060-0H020",
        "new",
        "24",
        "199.99",
        "10",
        "Alternators",
        "West Coast",
        "https://example.com/image.jpg",
        "High-quality alternator for Toyota vehicles",
      ],
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_upload_template.csv";
    a.click();
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get supplier ID
      let supplierId: string;

      if (soldByPlatform && platformSupplierId) {
        supplierId = platformSupplierId;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: supplier, error: supplierError } = await supabase
          .from("suppliers")
          .select("id, status")
          .eq("user_id", user.id)
          .single();

        if (supplierError) throw supplierError;

        if (supplier.status !== "approved") {
          toast({
            title: "Error",
            description: "Your supplier account must be approved first",
            variant: "destructive",
          });
          return;
        }

        supplierId = supplier.id;
      }

      // Convert Papa.parse into a synchronous promise
      const parseCSV = (file: File) =>
        new Promise<any[]>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err),
          });
        });

      const parsedRows = await parseCSV(file);

      if (!parsedRows || parsedRows.length === 0) {
        throw new Error("No products found in CSV");
      }

      // Build safe product rows
      const productsToInsert = parsedRows.map((product: any) => ({
        supplier_id: supplierId,
        sku: product.sku?.trim(),
        part_name: product.part_name?.trim(),
        condition: product.condition?.trim(),
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity),
        category: product.category?.trim(),

        // Optional fields — only included if present
        oem_cross_ref: product.oem_cross_ref || null,
        warranty_months: product.warranty_months ? parseInt(product.warranty_months) : 0,
        region: product.region || null,
        image_url: product.image_url || null,
        description: product.description || null,

        is_active: true,
        admin_approved: false,
      }));

      // Insert to Supabase
      const { error: insertError } = await supabase.from("supplier_products").insert(productsToInsert);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(insertError.message);
      }

      toast({
        title: "Success!",
        description: `Uploaded ${productsToInsert.length} products. They will appear after admin approval.`,
      });

      navigate("/supplier-dashboard");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Upload Product Inventory</CardTitle>
              <CardDescription>Upload your product catalog via CSV file</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            {isAdmin && platformSupplierId && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Switch id="platform-seller" checked={soldByPlatform} onCheckedChange={setSoldByPlatform} />
                <div className="flex-1">
                  <Label htmlFor="platform-seller" className="text-base font-semibold cursor-pointer">
                    Sold by Platform (DoneEZ)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable this to list products under the platform's name. No Stripe Connect setup required.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Upload CSV File</p>
                <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
              </div>

              <input
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel,application/csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />

              <label htmlFor="csv-upload">
                <Button variant="outline" asChild>
                  <span>Select CSV File</span>
                </Button>
              </label>

              {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">CSV Requirements:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Required columns: sku, part_name, condition, price, quantity, category</li>
              <li>Condition must be: new, refurbished, or used</li>
              <li>Price in decimal format (e.g., 199.99)</li>
              <li>Products will require admin approval before going live</li>
            </ul>
          </div>

          <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
            {loading ? "Uploading..." : "Upload Products"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
